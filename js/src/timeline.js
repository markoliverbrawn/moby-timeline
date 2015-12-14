// @prepros-prepend rainbow.js 
// @prepros-prepend mousewheel.js 


(function($){
    $.fn.timeline = function(options){
        
        // Private vars
        var _$me = $(this);
        var _$inner;
        var _dragging = false;
        var _events_by_date = {};
        var _minDate;
        var _maxDate;
        var _rainbow = new Rainbow();
        var _scrollInterval;
        var settings = $.extend({
            colorMode: '',
            data:[],
            monthNames:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            onCreate: function(){},
            src: '',
            templateEvent: '<span class="date">[date]</span><span class="description">[image][description]</span><a href="[link]">More...</a>'
        }, options );
        
        // Private functions        
        /**
         * Adds a feature (region, or event)
         * @param {object} feature
         * @param {string} cls
         * @returns {null}
         */
        function _addFeature(feature, cls, $appendTo)
        {
            var date_hash;
            var style = _getLeftAndWidth(feature, $appendTo);
            var $appendToMain = _$inner;
            if($appendTo!==undefined)
            {
                $appendToMain = $appendTo.find('main');
            }
            if(style.left===null)
            {
                return;
            }
            feature.$div = $('<div></div>')
                .appendTo($appendToMain)
                .css({
                    left: style.left + $appendToMain.scrollLeft(),
                    top: feature.top ? feature.top : null,
                    width: style.width
                })
                .data('data', feature)
                .html('<h2>'+feature.title+'</h2>'+(feature.content ? '<div>'+feature.content+'</div>' : ''))
                .click(_onFeatureClick);
        
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
            // If there is a scale, then add it
            if(feature.interval)
            {
                _addScale(feature);
            }
        }
        /**
         * Add scale ticks
         * @param {$jquery} period
         * @returns {void}
         */
        function _addScale(item)
        {
            if(item.interval)
            {
                var $ul = $('<ul class="scale"></ul>').css({
                    width:item.$div.width()
                }).appendTo(item.$div);
                $(item.interval).each(function(i, v){
                    $ul.append($('<li></li>').css({
                        left:_getDatePosition(v) - item.$div.offset().left
                    }).html(_formatDate(v)));
                });
            }
        }
        /**
         * Creates the timeline
         * @returns {null}
         */
        function _create()
        {
            var me = this;
            
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
                
                _$me.removeClass('loading');
                
            }
            
            // Load data from urls
            $(settings.src).each(function(i,v){
                
                setTimeout(function(){
                    
                    // Does the data src specify it's own parser function?
                    if(v.loadFunction && v.url)
                    {
                        v.loadFunction.call(me, v.url, me);
                    }
                    
                    // Is the default loadFunction overidden?
                    else if(settings.loadFunction)
                    {
                        settings.loadFunction.call(me, v, me);
                    }
                    
                    // Default loadFunction
                    else
                    {
                        _loadJSON(v);
                    }
                    
                }, 500*i);
            });
            
            return this;
        }
        /**
         * Helper to determine if 2 days are equal
         * 
         * @param {object} d1
         * @param {object} d2
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
         * @param {object} date
         */
        function _dateHash(date)
        {
            return ( date.year ? date.year : date )+'-'+( date.month ? date.month : '00' );//+'-'+( date.day ? date.day : '00' );
        }
        /**
         * Determine if a date item is between 2 others
         * @param {object} d
         * @param {object} start
         * @param {object} end
         * @return boolean
         */
        function _dateWithinRange(d, start, end)
        {
            //_debug(d);
            //_debug(start);
            //_debug(end);
            
            var y0 = d.year!=undefined ? d.year : d;
            var y1 = start.year!=undefined ? start.year : start;
            var y2 = end.year!=undefined ? end.year : end;
        
            
            
            return y0>=y1 && y0<=y2;
        }
        /**
         * Wrapper for console.log
         * @param {object} obj
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
                return d.format.replace('y', d.year).replace('m', settings.monthNames[d.month-1]).replace('d', d.day);
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
         * @param {number} y
         * @returns {string}
         */
        function _formatYear(y)
        {
            var ret = y;
            if(Math.abs(y)>=1000000)
            {
                ret = (Math.abs(y/1000000).toFixed(1)+'m yrs').replace('.0','');
            }
            else if(Math.abs(y)>10000)
            {
                ret = _numberWithCommas(Math.abs(y));
            }
            if(y < 0)
            {
                ret = ret+' BC';
            }
            return ret;
        }
        /**
         * Format a number with 1000s separator
         * @param {type} x
         * @returns {unresolved}
         */
        function _numberWithCommas(x) 
        {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        /**
         * Get a formatted date range
         * @param {object} dates
         * @returns {string}
         */
        function _formatDateRange(dates)
        {
            var ret = [_formatDate(dates.start)];
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
         * Determine the left position of a date
         * @param {object} date
         * @returns {number}
         */
        function _getDatePosition(date)
        {	
            var pos;
            var periodStart = date.year ? date.year : date;
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
                
                var scale =  timescale.width / ( timeScaleEnd - timeScaleStart ) ;

                if(periodStart >= timeScaleStart && periodStart < timeScaleEnd)
                {
                    pos = timescale.$div.offset().left + ((periodStart-timeScaleStart) * scale);
                    return;
                }	
            });
            return pos;
        }
        /**
         * Determine the left position and width of a feature
         * @param {object} period
         * @param {object} $element
         * @returns {timeline_L1.$.fn.timeline._getLeftAndWidth.size}
         */
        function _getLeftAndWidth(period, $element)
        {	
            var size = {left:null, width:0};		
		
            var timescales = settings.timescales;
            var periodStart = period.start.year ? period.start.year : period.start;
            var periodEnd = period.end.year ? period.end.year : period.end;
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
                    size.left = timescale.$div.position().left +  ((periodStart-timeScaleStart) * scale);
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
         * Get the total width of the timeline
         * @returns {Number}
         */
        function _getWidth()
        {
            var w = 0;
            _$inner.find('>div').each(function(i,v){
                var wn = $(v).offset().left + $(v).width();
                w = wn;
            });
            return w;
        }
        /**
         * Layout the divs
         * @returns {null}
         */
        function _layout()
        {            
            _rainbow.setNumberRange(0, settings.timescales.length);
            if(settings.colors)
            {
                _rainbow.setSpectrumByArray(settings.colors);
            } 
            _$inner = $('<main></main>').appendTo(_$me);
            $(settings.timescales).each(function(i, scale){
                settings.timescales[i].left = i==0 ? 0 : _$inner.children().last().position().left+_$inner.children().last().width();
                settings.timescales[i].$div = $('<div class="timespan"><h1>'+_formatYear(scale.start)+'</h1></div>').addClass(scale.class).appendTo(_$inner).css({
                    backgroundColor: settings.colorMode=='rainbow' ? '#'+_rainbow.colorAt(i) : _randomGreyscale(),
                    left: settings.timescales[i].left,
                    width: scale.width
                }).data('data', scale);                
                _addScale(settings.timescales[i]);
            });
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
        }
        /**
         * Load data from a url
         * @param {string}   url
         * @param {function} callback
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
                    if(callback!=undefined)
                    {
                        callback();
                    }
                },
                url: url
            })
        }
        /**
         * Parse and add data
         * @param {object} v
         */
        function _addDataItem(v)
        {
            var top;
            
            /* 
            // Undecided, but I think that stacking them, looks ugly, so sticking with random distribution for now
            var date_hash = _dateHash(v.date.start);
            _events_by_date[date_hash] ? _events_by_date[date_hash].push(v) : _events_by_date[date_hash] = [v];
            top = 10+(10*_events_by_date[date_hash].length);
            */
            top = (10+(60 * Math.random()))+'%';
            _addFeature({
                content:settings.templateEvent.replace('[title]',v.title).replace('[date]',_formatDateRange(v.date)).replace('[description]',v.description).replace(/\[link\]/g,v.link).replace('[image]',v.image?'<img src="'+v.image+'"/>':''),
                start:v.date.start,
                end:(v.date.end ? v.date.end : v.date.start),
                title:v.title,
                top: top
            }, 'event'+(true===v.keyEvent ? ' key-event' : '')+(v.image ? ' has-img' : '')+(v.class ? ' '+v.class : ''));
        }
        /**
         * Drag
         * @param {event} e
         * @returns {void}
         */
        function _onDrag(e)
        {
            var s = e.clientX;
            var sl = _$inner.scrollLeft();
            _$inner.mousemove(function(e){
               _$inner.scrollLeft(sl-(e.clientX-s));
            }).mouseup(function(e){
                $(e.currentTarget).unbind('mousemove').unbind('mouseup');
            });
        }
        /**
         * Expands an event
         * @param {event} e
         */
        function _onFeatureClick(e)
        {
            var $el = $(e.currentTarget);
            var $parent = $el.closest('main');
            var right = ($parent.width()-$parent.scrollLeft())<$el.offset().left+$el.find('h2').width();
            var bottom = $parent.height()/2 < $el.offset().top;
            $el.removeClass('right').removeClass('bottom').toggleClass('active');
            //_debug('('+_$inner.width()+'-'+_$inner.scrollLeft()+')<'+$el.offset().left+'+'+$el.find('h2').width()+')');
            if(right)
            {
                $el.addClass('right');
            }
            if(bottom)
            {
                $el.addClass('bottom');
            }
            //_scroll($el.data('data').start);
        }
        /*
         * Add keydown support for main timeline
         * @param {event} e
         */
        function _onKeyDown(e)
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
        /*
         * Add keyup support for main timeline
         * @param {event} e
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
         * @param {event} e
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
         * @param {event} e
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
                    $(settings.data).each(function(i, v){
                        if(_dateWithinRange(v.date.start, $clone.data('data').start, $clone.data('data').end))
                        {
                            _addFeature({
                                content:settings.templateEvent.replace('[title]',v.title).replace('[date]',_formatDateRange(v.date)).replace('[description]',v.description).replace(/\[link\]/g,v.link).replace('[image]',v.image?'<img src="'+v.image+'"/>':''),
                                start:v.date.start,
                                end:(v.date.end ? v.date.end : v.date.start),
                                title:v.title,
                                top: (10+(50 * Math.random()))+'%'
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
         * @param {event} e
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
         * @returns {String}
         */
        function _randomGreyscale()
        {
            return 'rgba(0,0,0,'+(0.0 + 0.1*Math.random())+')';
        }
        /**
         * Scroll it
         * @param {integer} d
         * @returns {void}
         */
        function _scroll(d)
        {
            _$inner.stop().animate({
                scrollLeft: _$inner.scrollLeft() - d
            });
        }
        /**
         * Scroll by an amount
         * 
         * @param {number} n
         * @returns {void}
         */
        function _scrollBy(n)
        {
            //_debug(_$inner.scrollLeft()+','+_$inner.width());
            _$inner.scrollLeft(_$inner.scrollLeft()-n);
        }
        /**
         * Scroll to a date
         * 
         * @param {object} date
         * @returns {void}
         */
        function _scrollToDate(date)
        {
            var scrollTo = (_$me.parent().width()/2) - _getDatePosition(date);
            _scroll(scrollTo);
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
            };
        });
    };
}(jQuery));