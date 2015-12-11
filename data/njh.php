<?php
header('Content-type:application/json');
$data = array();
$xml = simplexml_load_file('http://nigelhinton.co.uk/feed?post_type=timeline-events');
foreach($xml->xpath('//item') as $event) {
    $item = (object)array(
        'title'=>(string)$event->title,
        'date'=>(object)array(),
        //'image'=>'img/sample/'.$imgs[0],
        'description'=>strip_tags((string)$event->description),
        'link'=>(string)$event->link,
        'keyEvent'=>rand(1,5)==1
    );
    foreach($event->xpath('timeline:date') as $date)
    {
        if($date['year'])
        {
            $item->date->{$date['key']}->year = (int)$date['year'];
            if($date['month'])
            {
                $item->date->{$date['key']}->month = (int)$date['month'];            
            }
            if($date['day'])
            {
                $item->date->{$date['key']}->day = (int)$date['day'];            
            }
        }
    }
    $data[] = $item;
}
echo json_encode($data);