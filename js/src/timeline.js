// @prepros-prepend rainbow.js 
// @prepros-prepend mousewheel.js 

(function($){
    
    $.fn.timeline = function(options){
        
        var LAYOUT_HORIZONTAL = 0;
        var LAYOUT_VERTICAL = 1;
        
        // Private vars
        var _$me = $(this);
        var _$inner;
        var _events_by_date = {};
        //var _minDate;
        //var _maxDate;
        var _rainbow = new Rainbow();
        var _zoomFactor = 1;
        var settings = $.extend({
            colorMode: '',
            data: [],
            layoutMode: null,
            monthNames:['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            onMove: function(){},
            onZoom: function(){},
            src: [],
            templateEvent: '<span class="date">[date]</span><span class="description">[image][description]</span><a href="[link]" target="_blank">More...</a>',
            zoomSpeed: 0.1
        }, options );
        
        // Private functions  
        
        /**
         * Parse and add data
         * 
         * @param {object} v
         */
        function _addDataItem(v)
        {
            //var date_hash = _dateHash(v.date.start);
            //_events_by_date[date_hash] ? _events_by_date[date_hash].push(v) : _events_by_date[date_hash] = [v];
            
            if(!v.offset)
            {
                if(_isVertical())
                {
                    //v.offset = (20+(70 * Math.random()))+'%';
                }
                else
                {
                    //v.offset = (10+(60 * Math.random()))+'%';
                }
            }
            _addFeature({
                content:settings.templateEvent.replace('[title]',v.title).replace('[date]',_formatDateRange(v.date)).replace('[description]',v.description).replace(/\[link\]/g,v.link).replace('[image]',v.image?'<img src="'+v.image+'"/>':''),
                start:v.date.start,
                end:(v.date.end ? v.date.end : v.date.start),
                title:v.title,
                //offset: v.offset,
                data: v
            }, 'event'+(true===v.keyEvent ? ' key-event' : '')+(v.image ? ' has-img' : '')+(v.class ? ' '+v.class : ''));
        }
        /**
         * Adds a feature (region, or event)
         * 
         * @param {object} feature
         * @param {string} cls
         * @param {object} $appendTo
         * 
         * @returns {null}
         */
        function _addFeature(feature, cls, $appendTo)
        {
            var date_hash;
            var style = _getOffsetAndWidth(feature, $appendTo);
            var $appendToMain = _$inner;
            var axis1, axis2, cssProp;
            if(_isVertical())
            {
                axis1 = 'top';
                axis2 = 'left';
                cssProp = 'height';
            }
            else
            {
                axis1 = 'left';
                axis2 = 'top';
                cssProp = 'width';
            }
            
            if($appendTo!==undefined)
            {
                $appendToMain = $appendTo.find('main');
            }
            if(style[cssProp]===null)
            {
                return;
            }
            feature.$div = $('<div></div>')
                .appendTo($appendToMain)
                .css(axis1, style[axis1] + (axis1=='left' ? $appendToMain.scrollLeft() : $appendToMain.scrollTop()))
                .css(axis2, feature.offset ? feature.offset : null)
                .css(cssProp, style[cssProp])
                .data('data', feature)
                .html('<div><h2>'+feature.title+'</h2>'+(feature.content ? '<div>'+feature.content+'</div>' : '')+'</div>');
        
            if(feature.data)
            {
                feature.data.$div = feature.$div;
            }
            // Add a class if the feature has one specified
            if(cls)
            {
                feature.$div.addClass(cls);
            }
            // Add the internal class
            if(feature.class)
            {
                feature.$div.addClass(feature.class);
            }
            // Events
            if(!feature.$div.hasClass('event'))
            {
                switch(settings.colorMode)
                {
                    case 'rainbow':
                        feature.$div.css({
                            backgroundColor: settings.colorMode=='rainbow' ? _randomGreyscale() : _randomColor()                            
                        })
                        break;
                    case 'random':
                        feature.$div.css({
                            backgroundColor: _randomColor()
                        });
                        break;
                }
            }
            else
            {
                feature.$div.click(_onFeatureClick);
            }
            // If there is a scale, then add it
            if(feature.interval)
            {
                _addScale(feature);
            }
            
            // Save this for referencing when zooming
            _cacheOriginalStyle(feature.$div);
        }
        /**
         * Add scale ticks
         * 
         * @param {object} item
         * 
         * @returns {void}
         */
        function _addScale(item)
        {
            if(item.interval)
            {
                var cssProp = settings.layoutMode==LAYOUT_VERTICAL ? 'height' : 'width';
                var cssProp2 = settings.layoutMode==LAYOUT_VERTICAL ? 'top' : 'left';
                
                var $ul = $('<ul class="scale"></ul>')
                    .css(cssProp, cssProp == 'width' ? item.$div.width() : item.$div.height())
                    .appendTo(item.$div);
            
                $(item.interval).each(function(i, v){
                    var $li = $('<li></li>')
                        .css(cssProp2, (cssProp2=='left' ? _getDatePosition(v) - item.$div.position().left : _getDatePosition(v) - item.$div.offset().top))
                        .html(_formatDate(v))
                        .appendTo($ul);
                    
                    _cacheOriginalStyle($li);
                });
            }
        }
        /**
         * Cache the position and size of an element
         * 
         * @param {jquery} $el
         * 
         * @return {void}
         */
        function _cacheOriginalStyle($el)
        {
            // Save this for referencing when zooming
            $el.data('originalStyle', {
                height: $el.height(),
                left: _isFeature($el)? $el.offset().left+$el.parent().scrollLeft() : $el.position().left,
                top: _isFeature($el)? $el.offset().top+$el.parent().scrollTop() : $el.position().top,
                width: $el.width(),
            });

        }
        /*
         * Clear all features
         * 
         * @return {void}
         */
        function _clearFeatures()
        {
            _$me.find('.event').unbind().remove();
            settings.data = [];
        }
        /**
         * Convert a decimal year to a date
         * @param {decimal} decimalDate
         * @returns {Date}
         */
        function _convertDecimalDate(decimalDate) {
            var year = parseInt(decimalDate);
            var reminder = decimalDate - year;
            var daysPerYear = (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) ? 366 : 365;
            var miliseconds = reminder * daysPerYear * 24 * 60 * 60 * 1000;
            var yearDate = new Date(year, 0, 1);
            yearDate = new Date(yearDate.getTime() + miliseconds);
            return {
                year:year,
                month:yearDate.getMonth()+1,
                day:yearDate.getDate() 
            };
        }
        /**
         * Creates the timeline
         * 
         * @returns {null}
         */
        function _create()
        {
            var me = this;
            
            // Set vertical/horizontal
            if(null===settings.layoutMode)
            {
                settings.layoutMode = (_$me.height() > _$me.width() ? LAYOUT_VERTICAL : LAYOUT_HORIZONTAL);
            }
            
            // Add a helper class for the layout-mode
            _$me.addClass(settings.layoutMode === LAYOUT_VERTICAL ? 'vertical' : 'horizontal');
            
            // Show loading
            _$me.addClass('loading');
            
            
            // Create the layout regions
            _layout();
            
            // Load data if specified by config
            if(settings.data)
            {
                $(settings.data).each(function(i,v){
                    
                    _addDataItem(v);    
                    
                });
                _onDataLoaded();
                _$me.removeClass('loading');
                
            }
            
            // Load data from urls
            $(settings.src).each(function(i,v){
                
                setTimeout(function(){
                    
                    _loadData.call(me, v);
                    
                }, 500*i);
            });
            
            return this;
        }
        /**
         * Get the date at the current centre of screen
         * 
         * @returns {object}
         */
        function _currentDateAtCentre()
        {
            var centre = _isVertical() ? _$inner.offset().top + _$me.height()/2 : _$inner.offset().left + _$me.width()/2;
            return _getDateAt(centre);
        }
        /**
         * Helper to determine if 2 days are equal
         * 
         * @param {object} d1
         * @param {object} d2
         * 
         * @return {boolean}
         */
        function _datesEqual(d1, d2)
        {
            var eq = true;
            
            $.each(['day','month','year'],function(i,v){
                
                if(d1[v]!=d2[v])
                {
                    eq = false;
                    return;
                }
                
            });
            
            return eq;
        }
        /**
         * Stringify a date
         * 
         * @param {object} date
         * 
         * @return {string}
         */
        function _dateHash(date)
        {
            var y = date.year ? date.year : date;
            var m = date.month ? date.month : 1;
            var ym = y * m;
            
            return ym;
            //return ( date.year ? date.year : date )+'-'+( date.month ? date.month : '00' );//+'-'+( date.day ? date.day : '00' );
        }
        /**
         * Determine if a date item is between 2 others
         * 
         * @param {object} d
         * @param {object} start
         * @param {object} end
         * 
         * @return boolean
         */
        function _dateWithinRange(d, start, end)
        {
            var y0 = d.year !== undefined ? d.year : d;
            
            var y1 = start.year !== undefined ? start.year : start;
            
            var y2 = end.year !== undefined ? end.year : end;
        
            return y0 >= y1 && y0 <= y2;
        }
        /**
         * Wrapper for console.log
         * 
         * @param {object} obj
         * 
         * @returns {null}
         */
        function _debug(obj)
        {
            if(window.console && window.console.log) 
            {
                window.console.log(obj);
            }
        }
        /**
         * Format a date object|string
         * 
         * @param {type} d
         * 
         * @returns {String|@var;y}
         */
        function _formatDate(d)
        {
            if(!d.year)
            {
                return _formatYear(d);
            }
            
            if(d.format)
            {
                return d.format
                    .replace('y', d.year)
                    .replace('m', settings.monthNames[d.month-1])
                    .replace('d', d.day);
            }
            
            var ret = _formatYear(d.year);
            
            if(d.month)
            {
                ret = settings.monthNames[d.month-1]+' '+ret;
            }
            
            if(d.day)
            {
                ret = d.day+' '+ret;
            }
            
            return ret;
        }
        /**
         * Format a year based on magnitude
         * 
         * @param {number} y
         * 
         * @returns {string}
         */
        function _formatYear(y)
        {
            var ret = y;
            
            if( Math.abs( y ) >= 1000000 )
            {
                ret = ( Math.abs( y / 1000000 ).toFixed(1) + 'm yrs' ).replace( '.0', '' );
            }
            else if( Math.abs( y ) > 10000 )
            {
                ret = _numberWithCommas( Math.abs( y ) );
            }
            
            if(y < 0)
            {
                ret = ret + ' BC';
            }
            
            return ret;
        }
        /**
         * Get a formatted date range
         * 
         * @param {object} dates
         * 
         * @returns {string}
         */
        function _formatDateRange(dates)
        {
    
            var ret = [ _formatDate(dates.start) ];
            
            if(dates.end)
            {
            
                if(!_datesEqual(dates.start, dates.end))
                {
            
                    ret.push(_formatDate(dates.end));
                
                }
            
            }
            
            return ret.join(' to ');
        }
        /**
         * Get the date at a position
         * 
         * @param {int} pos
         */
        function _getDateAt(pos)
        {
            var csspos = _isVertical() ? 'top' : 'left';
            var size = _isVertical() ? 'height' : 'width';
            var date = {};
            
            //pos += _$inner[offsetFn]();
            
            $(settings.timescales).each(function(i, timescale){
                var left = timescale.$div.position()[csspos];
                var right = left + timescale.$div[size]();
                if(left <= pos && left + right >= pos)
                {
                    var relativePos = (pos - left)/(right - left);
                    var yearRange = timescale.end - timescale.start;
                    date.year = timescale.start + (yearRange * relativePos);
                    if(date.year < 1000)
                    {
                        date.string = _formatDate(date.year.toFixed(0));
                    }
                    else if(date.year)
                    {
                        // Add day/month info
                        date.string = _formatDate(_convertDecimalDate(date.year));
                    }
                    return;
                }
            });
            
            return date;
        }
        /**
         * Determine the left position of a date
         * 
         * @param {object} date
         * 
         * @returns {number}
         */
        function _getDatePosition(date)
        {	
            var pos;
            var periodStart = date.year ? date.year : date;
            var cssProp = _isVertical() ? 'top' : 'left';
                
            if(date.month && date.day)
            {
                periodStart = (periodStart * 365) + (30 * date.month) + date.day;
            }
            else if(date.month)
            {
                periodStart = (periodStart * 12) + date.month;
            }
            
            $(settings.timescales).each(function(i, timescale){
                
                var timeScaleStart = timescale.start;
                var timeScaleEnd = timescale.end;
                if(date.month && date.day)
                {
                    timeScaleStart*=365;
                    timeScaleEnd*=365;
                }
                else if(date.month)
                {
                    timeScaleStart*=12;
                    timeScaleEnd*=12;
                }
                
                var scale =  (timescale.width) / ( timeScaleEnd - timeScaleStart ) ;

                if(periodStart >= timeScaleStart && periodStart < timeScaleEnd)
                {
                    pos = timescale.$div.position()[cssProp] + ((periodStart-timeScaleStart) * scale);
                    return pos * _zoomFactor;
                }	
            });
            return pos;
        }
        /**
         * Determine the left position and width of a feature
         * 
         * @param {object} period
         * @param {object} $element
         * 
         * @returns {timeline_L1.$.fn.timeline._getLeftAndWidth.size}
         */
        function _getOffsetAndWidth(period, $element)
        {	
            var size = {left:null, width:0};		
		
            var timescales = settings.timescales;
            var periodStart = period.start.year ? period.start.year : period.start;
            var periodEnd = period.end.year ? period.end.year : period.end;
            var axis = _isVertical() ? 'top' : 'left';
            
            
            if(period.start.month && period.start.day)
            {
                periodStart = (periodStart * 365) + (30 * period.start.month) + period.start.day;
                periodEnd = (periodEnd * 365) + (30 * period.end.month) + period.end.day;
            }
            
            if($element!==undefined)
            {
                timescales = [
                    {
                        '$div': $element,
                        start: $element.data('data').start,
                        end: $element.data('data').end,
                        width: $element.width()
                    }
                ];
                //_debug(timescales);
            }
            
            $(timescales).each(function(i, timescale){
                
                var timeScaleStart = timescale.start;
                var timeScaleEnd = timescale.end;
                if(period.start.month && period.start.day)
                {
                    timeScaleStart*=365;
                    timeScaleEnd*=365;
                }
                
                var scale =  timescale.width / ( timeScaleEnd - timeScaleStart ) ;

                if(periodStart >= timeScaleStart && periodStart < timeScaleEnd)
                {
                    size[axis] = timescale.$div.position()[axis] +  ((periodStart-timeScaleStart) * scale);
                }	

                if(!(timeScaleEnd < periodStart || timeScaleStart>periodEnd))
                {
                    if(periodStart>timeScaleStart && periodEnd<timeScaleEnd)
                    {
                        size.width+= (periodEnd - periodStart) * scale;
                    }
                    else if(timeScaleStart<=periodStart && timeScaleEnd<=periodEnd)
                    {
                        size.width+= (timeScaleEnd - periodStart) * scale;
                    }
                    else if(timeScaleStart>periodStart && timeScaleEnd<periodEnd)
                    {
                        size.width+= timescale.width;
                    }
                    else if(timeScaleStart>=periodStart && timeScaleEnd>=periodEnd)
                    {
                        size.width+= (periodEnd - timeScaleStart) * scale;
                    }
                }
            });
            
            return size;
        }
        /**
         * Cache the position and size of an element
         * 
         * @param {jquery} $el
         * 
         * @return {object}
         */
        function _getOriginalStyle($el)
        {
            // Save this for referencing when zooming
            return $el.data('originalStyle');
        }   
        /**
         * Dtermine if an element if a feature (event)
         * @param {jquery} $el
         * @returns {boolean}
         */
        function _isFeature($el)
        {
            return $el.hasClass('event');
        }
        /**
         * Helper to determine if layout is vertical
         * 
         * @returns {Boolean}
         */
        function _isVertical()
        {
            return settings.layoutMode === LAYOUT_VERTICAL;
        }
        /**
         * Layout the divs.
         * 
         * @todo Split this. It's does too much and is too complex
         * 
         * @returns {null}
         */
        function _layout()
        {            
            _setLayoutMode(settings.layoutMode);
            
            var offsetProperty = _isVertical() ? 'top' : 'left';
            var sizeProperty = _isVertical() ? 'height' : 'width';
            
            // Set the colour routine
            _rainbow.setNumberRange(0, settings.timescales.length);
            if(settings.colors)
            {
                _rainbow.setSpectrumByArray(settings.colors);
            }
            
            // Add the mainn container
            _$inner = $('<main></main>').appendTo(_$me);
            
            // Add the main timescales
            $(settings.timescales).each(function(i, scale){
                
                if(i===0)
                {
                    settings.timescales[i][offsetProperty] = 0;
                }
                else
                {
                    settings.timescales[i][offsetProperty] = _$inner.children().last().position()[offsetProperty]+(offsetProperty==='left' ? _$inner.children().last().width() : _$inner.children().last().height());
                }
                
                settings.timescales[i].$div = $('<div class="timespan"><h1>'+_formatYear(scale.start)+'</h1></div>')
                    .addClass(scale.class)
                    .appendTo(_$inner)
                    .css('backgroundColor', settings.colorMode === 'rainbow' ? '#'+_rainbow.colorAt(i) : _randomGreyscale())
                    .css(offsetProperty, settings.timescales[i][offsetProperty])
                    .css(sizeProperty, scale.width)
                    .data('data', scale);
            
                // Save this for referencing when zooming
                _cacheOriginalStyle(settings.timescales[i].$div);
                
                // Add a scale
                _addScale(settings.timescales[i]);
            });
            
            // Add the periods
            $(settings.periods).each(function(i, period){
                period.class = period.class ? 'period '+period.class : 'period';
                _addFeature(period);
            });
            
            // Scroll to date if required
            if(settings.startDate)
            {
                _scrollToDate(settings.startDate);
            }
            
            // Add event handlers
            _$inner
                .mousedown(_onDrag)
                .keydown(_onKeyDown)
                .keyup(_onKeyUp)
                .mousewheel(function(e) {
                    e.preventDefault();
            
                    //_debug(e.deltaX, e.deltaY, e.deltaFactor);
                    _scrollBy(e.deltaY*100);
                })
                .attr('tabindex', 1)
                .focus()
                .find('>div')
                .dblclick(_regionExpand);
        
            $(window).resize(function(e){
                // todo
            });
        }
        /**
         * Load data
         * 
         * @param {string|object} src
         */
        function _loadData(src)
        {
            // Does the data src specify it's own parser function?
            if(src && src.loadFunction && src.url)
            {
                src.loadFunction.call(this, src.url, _onDataLoaded);
            }
        
            // Is the default loadFunction overidden?
            else if(settings.loadFunction)
            {
                settings.loadFunction.call(this, src, _onDataLoaded);
            }

            // Default loadFunction
            else
            {
                _loadJSON(src, _onDataLoaded);
            }
        }
        /**
         * Load data from a url
         * 
         * @param {string}   url
         * @param {function} callback
         * 
         * @returns {null}
         */
        function _loadJSON(url, callback)
        {
            //_debug('Loading data: '+url);
            _$me.addClass('loading');
            $.ajax({
                dataType:'json',
                success: function(data){
                    $(data).each(function(i,v){
                        _addDataItem(v);
                    });
                    settings.data = settings.data.concat(data);
                    _$me.removeClass('loading');
                    if(callback !== undefined)
                    {
                        callback();
                    }
                },
                url: url
            });
        }
        /**
         * Format a number with 1000s separator
         * 
         * @param {type} x
         * 
         * @returns {string}
         */
        function _numberWithCommas(x) 
        {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        /**
         * Called when data has finished being added. Realigns the data
         * 
         * @return {void}
         */
        function _onDataLoaded()
        {
            // First sort the data by date
            settings.data.sort(function(a, b){
                var am = a.date.start.month ? a.date.start.month : 0;
                var bm = b.date.start.month ? b.date.start.month : 0;
                return ~~((a.date.start.year * 12) + am >= (b.date.start.year * 12) + bm ? 1 : -1);
            });
            // Then re-render
            var offset = 110;
            $.each(settings.data, function(i, v){
                if(!v.offset)
                {
                    offset = offset+ (5 + Math.random());// Random is so that long running events don't obsure shorter ones
                    if(offset>90) offset = 5;
                    v.$div.css(_isVertical() ? 'left' : 'top', offset+'%');
                }
            });
        }
        /**
         * Drag
         * 
         * @param {event} e
         * 
         * @returns {void}
         */
        function _onDrag(e)
        {
            var me = this;
            var s;
            var sl;
            if(_isVertical())
            {
                s = e.clientY;
                sl = _$inner.scrollTop();
                _$inner.mousemove(function(e){
                   _$inner.scrollTop(sl-(e.clientY-s));
                }).mouseup(function(e){
                    $(e.currentTarget).unbind('mousemove').unbind('mouseup');
                });
                
                settings.onMove.call(me);
            }
            else
            {
                s = e.clientX;
                sl = _$inner.scrollLeft();
                _$inner.mousemove(function(e){
                   _$inner.scrollLeft(sl-(e.clientX-s));
                }).mouseup(function(e){
                    $(e.currentTarget).unbind('mousemove').unbind('mouseup');
                });
                
                settings.onMove.call(me);
            }
        }
        /**
         * Expands an event
         * 
         * @param {event} e
         * 
         * @return {void}
         */
        function _onFeatureClick(e)
        {
            var $el = $(e.currentTarget);
            var $parent = $el.closest('main');
            var eventLeft = $el.position().left;
            var right = $parent.width() < eventLeft + $el.find('h2').width();
            var bottom = $parent.height()/2 < $el.position().top;
            $el.removeClass('right').removeClass('bottom').toggleClass('active');
            if(right)
            {
                $el.addClass('right');
            }
            if(bottom)
            {
                $el.addClass('bottom');
            }
            _scrollToDate($el.data('data').start);
        }
        /*
         * Add keydown support for main timeline
         * 
         * @param {event} e
         * 
         * @return {void}
         */
        function _onKeyDown(e)
        {
            //alert(e.keyCode);
            if(_isVertical())
            {
                switch(e.keyCode)
                {
                    case 38:
                        _scroll(_$inner.height()/4);
                        break;
                    case 40:
                        _scroll(-_$inner.height()/4);
                        break;
                }
            }
            else
            {
                switch(e.keyCode)
                {
                    case 37:
                        _scroll(_$inner.width()/4);
                        break;
                    case 39:
                        _scroll(-_$inner.width()/4);
                        break;
                }
            }
        }
        /*
         * Add keyup support for main timeline
         * 
         * @param {event} e
         * 
         * @return {void}
         */
        function _onKeyUp(e)
        {
            return;
            switch(e.keyCode)
            {
                case 37:
                    _scroll(50);
                    break;
                case 39:
                    _scroll(-50);
                    break;
            }
        }
        /**
         * Collapse a region
         * 
         * @param {event} e
         * 
         * @returns {void}
         */
        function _regionCollapse(e)
        {
            var $el = $(e.currentTarget).closest('.clone');
            $('.clone').css({
                left:-1 + _$inner.scrollLeft(),
                position:'absolute'
            }).animate({
                height: $el.data('owner').height(),
                left: $el.data('owner').offset().left + _$inner.scrollLeft(),
                opacity:0,
                top: $el.data('owner').offset().top,
                width: $el.data('owner').width()
            }, function(){
                $el.remove();
                _$me.removeClass('zoomed');
            });
        }
        /**
         * Expand a region
         * 
         * @param {event} e
         * 
         * @returns {void}
         */
        function _regionExpand(e)
        {          
            if(!settings.enableRegionExpand)
            {
                return;
            }
            $('.clone button').trigger('click');
            var $el = $(e.currentTarget);
            var $clone = $el.clone(true)
                .css({backgroundColor:''})
                .attr('tabindex',1)
                .addClass('clone')
                .removeClass('rotate')
                .unbind()
                .appendTo(_$inner)
                .animate({
                    height:_$me.height(),
                    left:-1 + _$inner.scrollLeft(),
                    top:0,
                    width:_$me.width()+2
                }, function(){
                    _$me.addClass('zoomed');
                    $(this).css({
                        left:-1,
                        position:'fixed'
                    });
                    _debug(settings.data);
                    $(settings.data).each(function(i, v){
                        if(_dateWithinRange(v.date.start, $clone.data('data').start, $clone.data('data').end))
                        {
                            _addFeature({
                                content:settings.templateEvent.replace('[title]',v.title).replace('[date]',_formatDateRange(v.date)).replace('[description]',v.description).replace(/\[link\]/g,v.link).replace('[image]',v.image?'<img src="'+v.image+'"/>':''),
                                start:v.date.start,
                                end:(v.date.end ? v.date.end : v.date.start),
                                title:v.title,
                                offset:(10+(50 * Math.random()))+'%'
                            }, 'event'+(true===v.keyEvent ? ' key-event' : '')+(v.image ? ' has-img' : ''), $clone);
                        }
                    });
                })
                .data('owner', $el)
                .append($('<button></button>')
                    .click(_regionCollapse))
                .prepend('<main></main>')
                .keydown(_onRegionKeypress)
                .focus();
        
            var ulWidth = $clone.find('ul').width();
            $clone.find('ul').css({width:'100%'}).children().each(function(i,v){
                $(v).css({
                    left: ( 100 * ( $(v).position().left / ulWidth ) ) + '%'
                });
            });
            
            if($el.data('data').name && $el.data('data').start && $el.data('data').end)
            {
                // Is period region, so has start date and end date
                $clone.append('<div class="label start">'+_formatYear($el.data('data').start)+'</div>');
                $clone.append('<div class="label end">'+_formatYear($el.data('data').end)+'</div>');
            }
            
            _dragging = false;
        }
        /**
         * Keypress handlers for region expanded
         * 
         * @param {event} e
         * 
         * @returns {void}
         */
        function _onRegionKeypress(e)
        {
            switch(e.keyCode)
            {
                case 27:
                    _regionCollapse(e);
                    break;
            }
        }
        /**
         * Helper function to generate a random color
         * 
         * @returns {String}
         */
        function _randomColor()
        {
            var c = [];
            for(var i=0;i<=2;i++)
            {
                c.push(Math.round(255*Math.random()));
            }
            return 'rgba('+c.join(',')+',0.5)';
        }
        /**
         * Generate a random greyscale tone
         * 
         * @returns {String}
         */
        function _randomGreyscale()
        {
            return 'rgba(0,0,0,'+(0.0 + 0.1*Math.random())+')';
        }
        /**
         * Scroll it
         * 
         * @param {integer} d
         * 
         * @returns {void}
         */
        function _scroll(d)
        {
            if(settings.layoutMode==LAYOUT_VERTICAL)
            {
                _$inner.stop().animate({
                    scrollTop: _$inner.scrollTop() - d
                });
            }
            else
            {
                _$inner.stop().animate({
                    scrollLeft: _$inner.scrollLeft() - d
                });
            }
            
            settings.onMove.call(this);
        }
        /**
         * Set the layout mode
         * 
         * @param {int} newMode
         * 
         * @return {void}
         */
        function _setLayoutMode(newMode)
        {
            var oldMode = settings.layoutMode;
            
            if(newMode!==LAYOUT_VERTICAL)
            {
               newMode = LAYOUT_HORIZONTAL;
            }
            
            if(newMode!==oldMode)
            {
                _debug(newMode);
                _clear();
                _create();
            }
        }
        /**
         * Scroll by an amount
         * 
         * @param {number} n
         * 
         * @returns {void}
         */
        function _scrollBy(n)
        {
            if(settings.layoutMode==LAYOUT_VERTICAL)
            {
                _$inner.scrollTop(_$inner.scrollTop()-n);
            }
            else
            {
                _$inner.scrollLeft(_$inner.scrollLeft()-n);
            }
            
            settings.onMove.call(this);
        }
        /**
         * Scroll to a date
         * 
         * @param {object} date
         * 
         * @returns {void}
         */
        function _scrollToDate(date)
        {
            var scrollTo;
            if(_isVertical())
            {
                scrollTo = (_$me.parent().height()/2) - _getDatePosition(date);
                _scroll(scrollTo);
            }
            else
            {
                scrollTo = (_$me.parent().width()/2) - _getDatePosition(date);
                _scroll(scrollTo);
            }
            
            settings.onMove.call(this);
        }
        /**
         * Zoom it
         * 
         * @param {integer} factor
         * 
         * @return {void}
         */
        function _zoom(factor)
        {
            var oldZoom = settings._zoomFactor;
            _zoomFactor = factor;
            _$inner.find('>div, .scale li').each(function(i,v){
                var d = _getOriginalStyle($(v));
                var updates = _isVertical() ? {
                    height:d.height * factor,
                    top:d.top * factor,
                    transition: 'height '+settings.zoomSpeed+'s, top '+settings.zoomSpeed+'s'
                } : {
                    left:(d.left * factor),
                    transition: 'left '+settings.zoomSpeed+'s, width '+settings.zoomSpeed+'s',
                    width:d.width * factor
                };
                $(v).css(updates);
            });
            _$inner.scrollLeft(_$inner.scrollLeft()*factor);
            settings.onZoom.call(this, oldZoom, factor);
        }

        return this.each(function() {
            
            _create.call(this);
            
            // PUBLIC FUNCTIONS
            
            /**
             * Public method wrapper for  _addDataItem
             * 
             * @param {string} title
             * @param {string} description
             * @param {object} dateStart
             * @param {object} dateEnd
             * @param {string} link
             * @param {string} image
             * @param {string} cssClass
             * @param {boolean} isKeyEvent
             * @param {string} offsetTop
             */
            this.addItem = function(item) {                                
                item = $.extend({
                    title: '',
                    description: '',
                    date:{
                        start: {
                            year:null,
                            month:null,
                            day:null
                        },
                        end: {
                            year:null,
                            month:null,
                            day:null
                        }
                    },
                    link: '',
                    image: '',
                    class: '',
                    keyEvent: false,
                    top: null
                }, item);                
                _addDataItem(item);
                settings.data.push(item);
            };
            /**
             * Clear events
             * 
             * @return {void}
             */
            this.clearFeatures = function(){
                _clearFeatures(this);
            }
            /**
             * Get the date at a pixel
             * @param {int} x
             * @param {int} y
             * @returns {object}
             */
            this.getDateAtXY = function(x,y){
                
                return _isVertical() ? _getDateAt(y) : _getDateAt(x);
                
            };
            /**
             * Scroll to a date
             * 
             * @param {object} date
             * 
             * @return {void}
             */
            this.gotoDate = function(date){
                
                _scrollToDate(date);
                
            };
            /**
             * Load a data file
             * 
             * @param {string|object} src
             */
            this.loadData = function(src){
                
                _loadData.call(this, src);
            
            }
            /**
             * Zoom it
             * 
             * @param integer factor
             */
            this.zoom = function(factor){
                _zoom.call(this, factor);
            };
        });
    };

}(jQuery));