$(awk '
BEGIN{in_grid=0}
{
  if ($0 ~ /function StickyGrid/) in_grid=1
  if (in_grid) {
    if ($0 ~ /onMouseDown=\{\(\) => handleMouseDown/) {
      print $0
      print "                onClick={() => toggleCell(r, c)}  // mobile tap toggle"
      next
    }
  }
  print
}' src/EventPage.jsx)
