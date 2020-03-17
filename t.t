do_thing() {
    strapdown="<script src=\"/public/resources/strapdown.js\"></script>"
    newscript="  <script src=\"/public/resources/recipe-formatting.js\"></script>"
    sed -i "s:$strapdown:$strapdown\n$newscript:" "$1"
}
export -f do_thing
find public/recipes/ -name "*.html" -exec bash -c 'do_thing "$@"' bash {} \;
