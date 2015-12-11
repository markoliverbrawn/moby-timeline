var data = {
    colorMode: 'rainbow',
    startDate:{
        //year:1914
    },
    timescales:[
        {start:-4600000000,end:-542000000,width:500,interval:[-3000000000,-2000000000]},
        {start:-542000000,end:-66000000,width:120},
        {start:-66000000,end:-23000000,width:150},
        {start:-23000000,end:-1800000,width:250},
        {start:-1800000,end:0,width:200},
        {start:0,end:1900,width:200,interval:[500,1000,1500]},
        {start:1900,end:1914,width:200,interval:[1910]},
        {start:1914,end:1918,width:200,interval:[1915,1916,1917]},
        {start:1918,end:thisYear,width:2000,interval:[1930,1940,1950,1960,1970,1980,1990,2000,2010]}
    ],
    periods:[
        {title:'Precambrian',start:-4600000000,end:-542000000,class:'eon'},
            {title:'Hadean',start:-4600000000,end:-3800000000,class:'era rotate'},
            {title:'Archean',start:-3800000000,end:-2500000000,class:'era rotate'},
            {title:'Protorozeroic',start:-2500000000,end:-542000000,class:'era rotate'},
        {title:'Phanerozoic',start:-542000000,end:thisYear,class:'eon'},
            {title:'Cenozoic',start:-66000000,end:thisYear,class:'era',interval:[-40000000,-20000000,-10000000]},
                {title:'Quaternary',start:-1800000, end:thisYear, class:'age'},
                    {title:'Holocene',start:-11700, end:thisYear, class:'epoch rotate'},
                    {title:'Pleistocene',start:-1800000,end:-11700, class:'epoch rotate'},
                {title:'Neogene',start:-23000000, end:-1800000, class:'age'},
                    {title:'Pliocene',start:-5300000, end:-1800000, class:'epoch rotate'},
                    {title:'Miocene',start:-23000000,end:-5300000, class:'epoch rotate'},
                {title:'Paleogene',start:-66000000, end:-23000000, class:'age'},
                    {title:'Oligocene',start:-34000000,end:-23000000, class:'epoch rotate'},
                    {title:'Eocene',start:-56000000,end:-34000000, class:'epoch rotate'},
                    {title:'Paleocene',start:-66000000,end:-56000000, class:'epoch rotate'},
            {title:'Mesozoic',start:-252000000,end:-66000000,class:'era rotate'},												
            {title:'Paleozoic',start: -542000000,end: -252000000,class:'era rotate'},	
            {title:'20th Century',start: 1900, end:2000,class:'eon'},
                {title:'World War I',start: 1914, end:1918,class:'era rotate'},
                {title:'World War II',start: 1939, end:1945,class:'era rotate'}
    ],

    src:[
        'data/events.php?start=-4600000000&end=-542000000',
        'data/events.php?start=-542000000&end=-1800000',
        'data/events.php?start=-1800000&end=0',
        'data/events.php?start=-23000000&end=-1800000',
        'data/events.php?start=-66000000&end=-23000000',
        'data/events.php?start=-252000000&end=-66000000',
        'data/events.php?start=-252000000&end=-252000000',
        'data/events.php?start=0&end=1899',
        'data/events.php?start=1900&end='+thisYear
    ]
};