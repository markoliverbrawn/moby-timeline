<?php

error_reporting(E_ALL);
ini_set('display_errors',1);


header('Content-type:application/json');
    
$num = 10;

if(isset($_REQUEST['doncaster']))
{
    $data = getDoncasterEvents();
}
elseif(isset($_REQUEST['start']) && isset($_REQUEST['end']))
{
	$data = generateEvents(50, $_REQUEST['start'], $_REQUEST['end']);
    /*$data = array(
        (object)array(
            'date'=>(object)array(
                'start'=>(object)array('year'=>1915,'month'=>6,'day'=>1),
                'end'=>(object)array('year'=>1916,'month'=>6,'day'=>1)
            ),
            'title'=>'Merian straddler',
            'description'=>'Test boundary straddling',
            'keyEvent'=>true
        )
    );*/
}
else
{
	$data = array_merge(
		array(
			(object)array(
				'date'=>(object)array(
					'start'=>(object)array('year'=>-500000),
					'end'=>(object)array('year'=>1920)
				),
				'title'=>'Boundary straddler',
				'description'=>'Test boundary straddling',
				'keyEvent'=>true,
                'link'=>'#'
			)
		),
		generateEvents($num, -4600000000, -542000000),
		generateEvents($num, -542000000, -66000000),
		generateEvents($num, -66000000, -1800000),
		generateEvents($num, -1800000, -2000),
		generateEvents($num, -2000, 0),
		generateEvents($num, 0, 1900),
		generateEvents($num, 1900, date('Y')),
		getDoncasterEvents()
	);
}
echo json_encode($data);
exit;

function getImagesFromDir($path) {
    $images = array();
    if ( $img_dir = @opendir($path) ) {
        while ( false !== ($img_file = readdir($img_dir)) ) {
            // checks for gif, jpg, png
            if ( preg_match("/(\.gif|\.jpg|\.png)$/", $img_file) ) {
                $images[] = $img_file;
            }
        }
        closedir($img_dir);
    }
    return $images;
}
function generateString($num_words, $num_sentences=1)
{
    $sentences = array();
    $words = explode(' ', 'a ac accumsan adipiscing aliquam aliquet amet ante arcu at augue bibendum blandit commodo congue consectetur consequat convallis cras curabitur cursus dapibus diam dictum dolor donec dui duis efficitur egestas eget elementum elit enim erat eros est et etiam eu euismod ex facilisi fames faucibus felis fermentum finibus fusce gravida hendrerit iaculis id imperdiet in interdum ipsum justo lacinia lacus laoreet lectus leo libero ligula lorem luctus maecenas magna malesuada massa mauris maximus metus mi molestie morbi nam nec neque nibh nisi nisl non nulla nullam nunc odio orci ornare pharetra phasellus porta porttitor pretium primis proin pulvinar purus quam quis quisque rhoncus risus rutrum sapien scelerisque sed sem semper sit sodales sollicitudin suscipit suspendisse tempor tincidunt tortor tristique turpis ullamcorper ultrices ultricies urna ut varius vehicula vel velit vestibulum vitae vivamus viverra volutpat vulputate');
    for($i=0;$i<$num_sentences;$i++)
    {
        $sentence = array();
        for($ii=0;$ii<$num_words;$ii++)
        {
            $sentence[] = $words[rand(0, count($words)-1)];
        }
        $sentences[] = ucfirst(implode(' ', $sentence).($num_sentences>1 ? '.' : ''));
    }
    return implode('. ', $sentences);
}
function generateEvents($num, $start, $end)
{
    $data = array();
	$imgs = getImagesFromDir('../img/sample/');
    for($i=0;$i<$num;$i++)
    {
        $range = array($start, $end);
        $startYear = rand($range[0], $range[1]);
        $endYear = $startYear + rand(0, $range[1]-$startYear);    
        $title = ucwords(generateString(rand(1,5)));
        $description = ucwords(generateString(rand(1, 5), rand(3,10)));
        
        $startDate = array('year'=>$startYear);
        $endDate = array('year'=>$endYear);

        if($startYear > 0){
            $startDate['month'] = rand(1,12);
        }
        if($endYear > 0){
            $endDate['month'] = rand(1,12);
        }
        
        if($startYear > 1000){
            $startDate['day'] = rand(1,30);
        }
        if($endYear > 1000){
            $endDate['day'] = rand(1,30);
        }
        
		shuffle($imgs);
        $data[] = (object)array(
            'date'=>(object)array(
                'start'=>$startDate,
                'end'=>rand(1,10) > 9 ? $endDate : $startDate
            ),
            'title'=>$title,
            'image'=>'img/sample/'.$imgs[0],
            'description'=>$description,
            'link'=>'#',
            'keyEvent'=>rand(1,20)==1
        );
    }
    return $data;
}
/**
 * Get Doncaster Events
 * @param type $time_start
 * @param type $time_end
 * @return array
 */
function getDoncasterEvents()
{
   //$filename = 'WWI-events-wikipedia-links';
   $filename = 'Toplevel_timeline26_8_15';

   $csvFile = dirname(dirname(__FILE__)).'/data/'.$filename.'.csv';
   $raw_events = array();

   $k = 0;
   if (($handle = fopen($csvFile, "r")) !== false) {
	   while (($data = fgetcsv($handle, 1000, ",")) !== false) {
		   if ($k == 0) {
			   $fields = $data;
		   } else {
			   $line = $data;
			   foreach ($fields as $kk => $vv) {
				   $raw_events[$k][$vv] = $line[$kk];
			   }
			   $raw_events[$k]['id'] = $k;
		   }
		   $k++;
	   }
	   fclose($handle);
   }

   $dates = array();

   foreach ($raw_events as $event) {
		$timeStart = makeTime($event['Begin']);
		$dateKey = date('Ym', $timeStart);
        $title = substr(utf8_encode($event['Event-no-links']),0,  strpos($event['Event-no-links'], '.'));
		$item = (object)array(
			'date'=>(object)array(
				'start'=>(object)array(
					'year'=>(int)date('Y', $timeStart),
					'month'=>(int)date('m', $timeStart),
					'day'=>(int)date('d', $timeStart)
				)
			),
			'class'=>$event['Theater'],
			'title'=>$title ? $title : utf8_encode($event['Event-no-links']),
			'description'=>utf8_encode($event['Event-no-links']),
			'link'=>$event['Source']
		);
		if($event['End'] && $event['End']!=$event['Begin'])
		{
			$timeEnd = makeTime($event['End']);		
			$item->date->end = (object)array(
				'year'=>(int)date('Y', $timeEnd),
				'month'=>(int)date('m', $timeEnd),
				'day'=>(int)date('d', $timeEnd)
			);
		}
		if(rand(1,20)==1)
		{
			$item->keyEvent = true;
		}
		$dates[] = $item;
   }

   return $dates;
}
/**
 * Return timestamp for a date in the format d/m/Y . strtotime gets confused sporadically
 *
 * 13/01/1924 evalutates to 01-01-1970
 *
 * @param string $date
 *
 * @return long
 */
function makeTime($date)
{
   return strtotime(implode(
		   '-',
		   array_reverse(
			   explode('/', $date)
		   )
	   )
   );
}