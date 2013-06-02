# jQuery Ajax Hijacking (subject to change)
jQuery plugin(?) for enabling reload-less navigating through website.
It works by binding to all the links and forms for a click and submit event respectively.

# How to use it:
Add `<script src="path/to/jquery.ajax-hijacking.js"></script>`, add `ajax-hijacking-wrapper` id to one of yours wrapper
elements and you should be fine...

### Except you're not

#### First
As you might know, one does not simply reloads all scripts and styles on the page. That's why we use some kind of
technique to achieve full reload.

Use `<meta name="css-hijacks" id="css-hijacks" />` and `<meta name="js-hijacks" id="js-hijacks" />` to anchor the place
after which all your stylesheets and scripts will be inserted. By the way, all your stylesheets and scripts should
have class `css-hijack` and `js-hijack` in order to make it reloadable. You don't need to use this classes if you want to keep the
tag across all ajax calls.

#### Second
Take a rule, you should always wrap your code you want to be reloadable with jQuery() for it to be executed
at the right time at the right place.

#### Third
If you need some persistent scripts to reload, you must actually replace jQuery's ready handler. See example to see how
it works.

#### Fourth
If you want to use your own handlers on some links to click or forms to submit, prevent propagation (and default action).
Want default action to be executed? &mdash; Add target="_self" attribute and be sure it won't be carried by the script.


tl;dw

### Exapmle

```
<!-- ... -->
<head>

<!-- your permanent stylesheets -->
<link rel="stylesheet" type="text/css" href="..." /><!-- can also be a style tag -->

<!- your css sink tag -->
<meta name="css-hijacks" id="css-hijacks" />

<!-- your replaceable stylesheets (may vary in templates; typically page-specific styles) -->
<link rel="stylesheet" type="text/css" href="..." class="css-hijack" /><!-- can also be a style tag -->

<!-- don't forget the jQuery -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>

<!-- include this cool script, yeah -->
<script src="path/tp/jquery.ajax-hijacking.js"></script>

<!-- your casual scripts which don't depend on DOMReady event (typically libs and frameworks) -->
<script src="..."></script><!-- can also be an inline script -->

<!-- your reloadable scripts (reloaded after every request; typically stuff that does something after DOMReady) -->
<script>jQuery.ready.persistent();</script><!-- hijacking jQuery.ready -->
<script src="..."></script><!-- can also be an inline script -->
<script>jQuery.ready.restore();</script><!-- restoring jQuery.ready -->

<!-- your js sink tag -->
<meta name="js-hijacks" id="js-hijacks" />

<!-- your replaceable scripts (may vary in templates; typically page-specific scripts) -->
<script src="..." class="js-hijack"></script><!-- can also be an inline script -->
</head>
<body>
	<!-- stuff like header; stays the same across all ajax calls -->
	<div id="ajax-hijacking-wrapper">
		<!-- replaceable content -->
	</div>
	<!-- stuff like footer; stays the same across all ajax calls -->
</body>
<!-- ... --->
```

# Where it works? 
Latest FF, Chrome, Opera, Safari, some mobile b.. anywhere where HTML5 History API does. That means IT'S NO USE to 
enable this stuff for IE lteq 9. I guess, you should use [modernizr](http://modernizr.com/) in order to check it.

# Why the heck would you do this to us?
Why not. Also, this script should be (in theory) fully transparent, you could just comment scripts that activate hijacking
and everything will be old school again.
