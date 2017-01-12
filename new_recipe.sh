

name="$1"

cat << EOF > "${name}.html"
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>

<title>$name</title>

<xmp theme="cerulean" style="display:none;">
# $name # 

## Ingredients ## 


## Method ## 

</xmp>

<script src="http://strapdownjs.com/v/0.2/strapdown.js"></script>
</html>

EOF
