find public/recipes/ \( -name "*.pdf" -o -name "*.html" -o -name "*.jpg" \) -exec bash -c "
echo \"{} \`git log -1 --pretty=\"format:%ci\" \"{}\"\`\"
" \;

