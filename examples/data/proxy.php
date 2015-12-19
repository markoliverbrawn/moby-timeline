<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-type:application/xml');
switch(@intval($_REQUEST['url']))
{
    case 1:
    readfile('http://nigelhinton.co.uk/feed?post_type=timeline-events');
    break;

    case 2:
        // Collections Base search
        $q = isset($_REQUEST['q']) ? $_REQUEST['q'] : '*:*';
        $d1 = @intval($_REQUEST['d1']);
        $d2 = @intval($_REQUEST['d2']);
        $parts = array(
            'http://api.collectionsbase.org.uk/os/?',
            'q.op=AND',
            'queryType=lucene',
            'startPage=0',
            'q='.rawurlencode("(($q)) AND ((date_earliest:[$d1 TO $d2] OR date_latest:[$d1 TO $d2]) OR (date_earliest:[0 TO $d1] AND date_latest:[$d2 TO 2020]))"),
            'count=100',
            'fq[]=have_thumbnail:1',
            //'fq[]=dcterms.isPartOf:*',
            'facet=off',
            'facet.mincount=1'
        );
        $url = implode('&', $parts);
        //die($url);
        readfile($url);
    break;
}
