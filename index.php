<!doctype html>
<html>
    <head>
        <meta charset="UTF-8">
		<link href='https://fonts.googleapis.com/css?family=Lato:400,400italic,700,700italic' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="css/styles.css"/>
        <link rel="stylesheet" href="js/timeline/css/styles.css"/>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
        <script src="js/timeline/js/timeline.min.js"></script>        
    </head>
    <body class="<?php echo @$_REQUEST['t'];?>">
        <?php if(@$_REQUEST['t']!='doncaster'):?>
		<form method="get">
			<select name="t" onchange="if(this.value=='doncaster'){window.open('examples/doncaster.php');return;}else{this.form.submit();}">
				<option value="">-- Select Timeline --</option>
				<option value="full">Full</option>
				<option value="doncaster">Doncaster WW1</option>
				<option value="shrewsbury">Nigel J Hinton</option>
			</select>
		</form>
        <?php endif;?>
		<?php if(isset($_REQUEST['t'])):?>
		<div>
			<div class="timeline"></div>
			<script>
				var now = new Date();
				var thisYear = now.getFullYear();
                <?php include 'data/timeline-'.$_REQUEST['t'].'.js';?>
				$('.timeline').timeline(data);
			</script>
		</div>
		<?php endif;?>
    </body>
	<!-- 
	TIME:
	20151204	Billable	3hrs	Ether layout
	20151205	Billable	3hrs	Rejigging with timescales to layout
	20151205	Billable	1hrs	Timescale for straddling bands
    20151206    Billable	2.5hrs  Rainbow colouring, region click, styling
    20151206    Billable	2hrs    Region zoom
    20151206    Billable	3hrs    Events plotting
	20151207	Office		1hr		Events underlay experiments
	20151208	Office		1hr		Drag to scroll and event-click + getting Doncaster events CSV to appear
    20151209    Office      1.5hrs  Doncaster example
    20151210    Office      3.5hrs  Zoom region
	20151210	Billable	3hrs	Restyling - simplfying due to memory issues
	-->
</html>