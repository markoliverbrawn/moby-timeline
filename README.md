# MOBy Timeline
A timeline widget for historical heritage timelines with a focus on `stylability` and `scalability`.

## View the Examples
[Examples](http://whiteleviathan.co.uk/static/timeline/examples/index.html "View the examples here")

## Quick Start
Grab the code.
Create "test.html" in the examples directory, containing the following markup:

```
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="../css/styles.css"/>
    <style type="text/css">
        html, body{
		height:100%;
		margin:0;
		padding:0;
	}
    	.timespan{
       		border:none!important;
	}
    </style>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
    <script src="../js/timeline.min.js"></script>
  </head>
  <body>
      <div class="timeline"></div>
	  <script>
		$('.timeline').timeline({
			colorMode: 'rainbow',
        		colors:['000000','000000'],
			timescales:[
				{
					start: 1900,
					end: 2000,
					width: $(window).width(),
					interval:[1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990]
				}
			],
			data:[
				{
					date:{
						start:{
							year: 1912,
							month: 4,
							day: 15
						}
					},
					title: "RMS Titanic Sinks",
					image: "https:\/\/upload.wikimedia.org\/wikipedia\/commons\/thumb\/f\/fd\/RMS_Titanic_3.jpg\/100px-RMS_Titanic_3.jpg",
					description: "RMS Titanic was a British passenger liner that sank in the North Atlantic Ocean in the early morning of 15 April 1912 after colliding with an iceberg during her maiden voyage from Southampton, UK, to New York City, US.",
					link: "https:\/\/en.wikipedia.org\/wiki\/RMS_Titanic",
					keyEvent: true
				}
			]
		});
	</script>
  </body>
</html>
```
This will create a bare bones timeline in black, with one "Timescale", a scale, and a single event.

## Features
1. Drag to scroll
2. Manually trigger jump-to-date for external navs
3. "Unlimited" timescales and regions
4. Load from AJAX or config
5. CSS styled for granular design customisation
6. Custom loadFunction-ality
