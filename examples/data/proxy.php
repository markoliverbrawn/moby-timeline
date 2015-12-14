<?php
header('Content-type:application/xml');
switch(@intval($_REQUEST['url']))
{
    case 1:
    readfile('http://nigelhinton.co.uk/feed?post_type=timeline-events');
    break;
}