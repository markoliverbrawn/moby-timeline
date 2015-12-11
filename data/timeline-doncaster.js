var data = {
	colorMode: 'rainbow',
	colors: ['c20430','333333'],
	timescales:[
                {start:1800,end:1914,width:500,interval:[1850]},
		{start:1914,end:1915,width:500,interval:[{year:1914,month:3,format:'m'},{year:1914,month:6,format:'m'},{year:1914,month:9,format:'m'}]},
		{start:1915,end:1916,width:500},
		{start:1916,end:1917,width:500},
		{start:1917,end:1918,width:500},
		{start:1918,end:1930,width:500}
	],
	periods:[
	],
	
	src:['data/events.php?doncaster=1']
};