(function ($) {
	var DeferredPersistent = function( func ) {
			var tuples = [
					// action, add listener, listener list, final state
					[ "resolve", "done", $.Callbacks("memory"), "resolved" ],
					[ "reject", "fail", $.Callbacks("memory"), "rejected" ],
					[ "notify", "progress", $.Callbacks("memory") ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					then: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;
						return $.Deferred(function( newDefer ) {
							$.each( tuples, function( i, tuple ) {
								var action = tuple[ 0 ],
									fn = $.isFunction( fns[ i ] ) && fns[ i ];
								// deferred[ done | fail | progress ] for forwarding actions to newDefer
								deferred[ tuple[1] ](function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && $.isFunction( returned.promise ) ) {
										returned.promise()
											.done( newDefer.resolve )
											.fail( newDefer.reject )
											.progress( newDefer.notify );
									} else {
										newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
									}
								});
							});
							fns = null;
						}).promise();
					},
					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? $.extend( obj, promise ) : promise;
					}
				},
				deferred = {};

			// Keep pipe for back-compat
			promise.pipe = promise.then;

			// Add list-specific methods
			$.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 3 ];

				// promise[ done | fail | progress ] = list.add
				promise[ tuple[1] ] = list.add;

				// Handle state
				if ( stateString ) {
					list.add(function() {
						// state = [ resolved | rejected ]
						state = stateString;

						// [ reject_list | resolve_list ].disable; progress_list.lock
					}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
				}

				// deferred[ resolve | reject | notify ]
				deferred[ tuple[0] ] = function() {
					deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
					return this;
				};
				deferred[ tuple[0] + "With" ] = list.fireWith;
			});

			// Make the deferred a promise
			promise.promise( deferred );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},
		readyListPersistent = DeferredPersistent(),
		readyList = $.Deferred();

	// saving initial promise
	$.ready._promise = $.ready.promise;

	$.ready.persistent = function () {
		$.ready.promise = function( obj ) {
			return readyListPersistent.promise( obj );
		};
	};

	$.ready.once = function () {
		$.ready.promise = function( obj ) {
			return readyList.promise( obj );
		};
	};

	$.ready.restore = function () {
		$.ready.promise = $.ready._promise;
	};

	$.ready.reload = function () {
		$.readyWait = 1;
		$.isReady = false;

		readyList = $.Deferred();
	};

	$.ready.bind = function () {
		$.ready._promise().then(function () {
			readyListPersistent.resolveWith( document, [ $ ]);
			readyList.resolveWith( document, [ $ ]);
		});
	};

	$.ready.bind();
})(jQuery);

jQuery(function ($) {
	var $document = $(document),
		$document_body = $(document.body),
		$window = $(window),
		$globals = $document.add($document_body).add($window);

	//noinspection JSValidateTypes
	var settings = $.extend({
		'cssHjAnchor': '#css-hijacks',
		'cssHjSelector': '.css-hijack',
		'jsHjAnchor': '#js-hijacks',
		'jsHjSelector': '.js-hijack',
		'rootElement': '#ajax-hijacking-wrapper'
	}, $document_body.data());

	var root = $(settings['rootElement']),
		css_hijacks = $(settings['cssHjAnchor']),
		js_hijacks = $(settings['jsHjAnchor']),
		css_selector = settings['cssHjSelector'],
		js_selector = settings['jsHjSelector'];

	function request(pathname, data, type) {
		var request_args = {
			'headers': {
				'X-Ajax-Hijacking': 'Enabled'
			},
			'type': type,
			'data': data,
			'success': function accept_response(data, textStatus, xhr) {
				var redirect = xhr.getResponseHeader('X-Ajax-Hijacking-Redirect');

				// if that's a redirect
				if (redirect) {
					var location = xhr.getResponseHeader('Location');

					request(location);
					return;
				}

				// notifying about finishing loading
				$window.trigger('location-loaded', pathname);

				var $data = $(data);

				// resetting the title
				document.title = $data.filter('title').text();

				// reloading list of ready callbacks
				$.ready.reload();
				$.ready.once();

				// replacing css links
				$document.find(css_selector).remove();
				css_hijacks.after( $data.filter(css_selector) );

				// disabling local listeners
				$globals.off('.local');

				// replacing js links
				$document.find(js_selector).remove();
				js_hijacks.after( $data.filter(js_selector) );

				root.html( $data.filter(settings['rootElement']).html() );

				// altering history state
				history.replaceState({'pathname': pathname}, document.title, pathname);

				setTimeout(function () {
					$.ready.restore();
					$.ready.bind();
					$.ready();

					// notifying about location change
					$window.trigger('location-changed', pathname);
				}, 200);
			}
		};

		if (data instanceof FormData) {
			$.extend(request_args, {
				'processData': false,
				'contentType': false
			});
		}

		$window.trigger('location-changing');

		$.ajax(pathname, request_args);
	}

	var initial = location.pathname + location.search,
		initial_break = false;

	$(document)
		.on('click', 'a', function (e) {
			var target = this.getAttribute('target'),
				urn = this.pathname + this.search;

			if (target !== null || e.ctrlKey || e.altKey || e.shiftKey) {
				return;
			}

			// only local routing
			if (this.hostname === location.hostname
				&& (this.pathname !== location.pathname || this.search !== location.search || !this.hash)) {
				// preventing from page reload
				e.preventDefault();
				e.stopPropagation();

				// creating history state
				history.pushState({'pathname': urn}, this.textContent, urn);

				// scroll to top
				document.body.scrollTop = document.documentElement.scrollTop = 0;

				// load page
				request(urn);

				// mark initial break
				initial_break = true;
			}
		})
		.on('submit', 'form', function (e) {
			var target = this.getAttribute('target'),
				anchor;

			if (target !== null || e.ctrlKey || e.altKey || e.shiftKey) {
				return;
			}

			anchor = document.createElement('a');
			anchor.href = this.action;

			// only local routing
			if (anchor.hostname === location.hostname) {
				e.preventDefault();

				var method = this.method.toUpperCase();

				request(this.action, method === 'GET' ? $(this).serialize() : new FormData(this), method);
			}
		})
		.on('request-location-change', function (e, options) {
			request(options.pathname, options.data, options.type);
		});

	$window.on('popstate', function (e) {
		var state = e.originalEvent.state;

		if (state && state.pathname) {
			request(state.pathname);
		} else if (initial === location.pathname + location.search && initial_break) {
			request(initial);
		}
	});
});
