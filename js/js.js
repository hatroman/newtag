(function() {
	var tagsLoadUrl = 'data/tags.json';
	var tagsCreateUrl = '/tag';

	$(function() {
		$(document)
			.on('click', '.show-create-tag-window', function() {
				popupOpen( {
					url: $(this).data('popupUrl'),
					slider: true,
					callback: function() {
						new TagWindow();
					},
					w: 730
				})
			});
	});

	/** ============== Контролы ============== **/
	function TagWindow() {
		var _this = this;
		var root = $('.tags-window-carrier');

		this._construct = function() {

			var tagsTree = _this.tagsTree = new TagsTree();
			$(tagsTree).on('select', function(e) {
				$('.js-tag-parent').data('tag', e.tag).val(e.tag.label);
			});

			var parentTag = _this.parentTag = new ParentTag();
			$(parentTag).on('select', function(e) {
				$('.js-tag-parent').data('tag', e.tag);
				tagsTree.selectNode(e.tag);
			});

			this.tagInputs = new TagInputs(root);

			$.getJSON(tagsLoadUrl)
				.success(function(json) {
					tagsTree.render( createTagsTreeModel(json.tags) );//TODO load
					parentTag.init( createAutocompleteModel(json.tags) );
				});

			root.on('click.tagForm', '.js-create-tag', $.proxy(this.submit, this));
			root.on('click.tagForm', '.close-window.grey-button', $.proxy(this.cancel, this));
		};

		this._destroy = function() {
			this.tagInputs.destroy();
			this.tagsTree.destroy();
			this.parentTag.destroy();

			root.off('.tagForm');
			popupClose();
		};

		this._createTag = function() {
			$.post(tagsCreateUrl, {
				title:  root.find('.js-tag-name').val(),
				name: root.find('.js-tag-code').val(),
				parent_name: root.find('.js-tag-parent').val()
			});
		};

		this.cancel = function() {
			this._destroy();
		};

		this.submit = function() {
			this._createTag();
			this._destroy();
		};

		this._construct();
	}
	function ParentTag() {
		var _this = this;

		this.init = function(model) {
			$('.js-tag-parent').autocomplete({
				minLength: 3,
				source: model,
				focus: function( event, ui ) {
					$(event.target).val(ui.item.label);
					return false;
				},
				select: function( event, ui ) {
					$(event.target).val(ui.item.label)
								   .data('tag', ui.item);

					$(_this).triggerHandler({
						type: 'select',
						tag: ui.item
					});
					return false;
				}
			})
				.data( "ui-autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li>" )
						.append( "<a>" + item.label +
							(item.parent ?" <span style='color:#9b9b9b'>(" + item.parent + ")</span>" : "") +
							"</a>" )
						.appendTo( ul );
				};
		};

		this.destroy = function() {
			$('.js-tag-parent').autocomplete('destroy');
		};
	}
	function TagsTree() {
		var _this = this;
		var elem = $('.tree-tag-carrier');
		var treeRoot = $('.tree-tag-carrier>.content-block').empty();
		var viewModel = {};
		var tagsHash = {};

		this._init = function() {
			//attach events
			elem
				.on('click.tagTree', '.tree-expand-trigger', function() {
					$(this)
						.toggleClass('active-icon-block')
						.closest('.line-block').find('>.column-block').toggleClass('active-column-block');
				})
				.on('mousedown.tagTree', '.tree-expand-trigger', function(e) { e.preventDefault(); });

			//TODO unbind
			elem.on('click.tagTree', '.general-button', $.proxy(this.activateTag, this));

			//TODO unbind
			elem
				.on('focus.tagTree', '.tag-search-block>input', function() {
					var val = $(this).val();
					$(this).val('');
					if (val != '') {
						_this._updateTree(viewModel);
					}
				})
				.on('keyup.tagTree', '.tag-search-block>input', function() {
					clearTimeout(this.timeout);
					var value = $(this).val();
					this.timeout = setTimeout(function() {
						value == '' ? _this._updateTree(viewModel) : _this.filterTags(value);
					}, 100);
				});
		};

		this.destroy = function() {
			elem.off('.tagTree')
		};

		this.activateTag = function() {
			var active = elem.find('input[type="radio"]:checked');
			if (!active.length) {
				return;
			}

			$(this).triggerHandler({
				type: 'select',
				tag: tagsHash[active.data('tag-path')]
			});
		};

		this._createTags = function(nodeElem, viewModel) {
			if (nodeElem.children().length > 0)
				return;

			nodeElem.append( renderSubtree(viewModel['root']) );

			function renderSubtree(subtreeData) {
				var tagsHtml = [];
				tagsHtml.push('<div class="column-block">');

				for (var i = 0; i < subtreeData.length; i++) {
					var tag = subtreeData[i];

					tagsHtml.push('<div class="line-block">');
					tagsHtml.push( renderLine(tag) );
					if (tag.children) {
						tagsHtml.push( renderSubtree(viewModel[tag.children]) );
					}
					tagsHtml.push('</div>');
				}

				tagsHtml.push('</div>');
				return tagsHtml.join('');
			}

			function renderLine(tag) {
				return '<div class="line-name">' +
					(tag.children? '<span class="icon-block inline-block tree-expand-trigger"></span>' : '') +
					'<label>' + tag.name + ' <input class="styled-input" type="radio" data-tag-path="' + tag.path + '" name="some-group-1"></label>\
					</div>';
			}
		};

		this.selectNode = function(tag) {
			if (!tag) {
				return;
			}
			var node = treeRoot.find('[data-tag-path="' + combine(tag.parent, tag.label) + '"]');
			node.parents('.column-block').addClass('active-column-block')
				.prev().find('.icon-block').addClass('active-icon-block');

			node.click();

			treeRoot.scrollTop(-(treeRoot.height() - node[0].offsetTop - treeRoot.scrollTop() - node.outerHeight(true)))
		};


		this._updateTree = function(vm) {
			this._createTags(treeRoot.empty(), vm);
		};

		this.filterTags = function(value) {
			var vm = {'root': []};

			for (var path in tagsHash) if (tagsHash.hasOwnProperty(path)){
				if (path.toLowerCase().indexOf(value.toLowerCase()) != -1) {
					vm['root'].push ($.extend({}, tagsHash[path], {name: path, children: null} ));
				}
			}

			this._updateTree(vm);
		};

		this.render = function(tagsTreeModel) {
			viewModel = tagsTreeModel.vm;
			tagsHash = tagsTreeModel.hash;

			this._createTags(treeRoot, viewModel);
		};

		this._init();
	}
	function TagInputs (root) {
		this._construct = function () {
			root
				.on('keypress.tagInputs', 'input', function (e) {
					switch ($(this).data('mask')) {
						case 'ru': {
							return isRussian(e.which);
						}
						case 'en': {
							return isLatin(e.which);
						}
					}
				})
				.on('paste.tagInputs', 'input', function () {
					pasteValueIf($(this), function (text) {
						switch ($(this).data('mask')) {
							case 'ru': {
								return checkText(text, isRussian);
							}
							case 'en': {
								return checkText(text, isLatin);
							}
						}
					});
				});
		};
		this.destroy = function() {
			root.off('.tagInputs');
		};

		this._construct();
	}


	/** ============== Всякие функции ============== **/
	function combine(p1, p2) {
		return p1 ? p1 + '/' + p2: p2;
	}
	function isRussian(ch) {
		return (ch >= 'а'.charCodeAt(0) && ch <= 'я'.charCodeAt(0)) || ch == 'ё'.charCodeAt(0);
	}
	function isLatin(ch) {
		return ch >= 'a'.charCodeAt(0) && ch <= 'z'.charCodeAt(0);
	}
	/**
	 *
	 * @param {jQuery} input
	 * @param {Function} condFn - условие, при выполнении которого текст будет вставлен
	 */
	function pasteValueIf(input, condFn) {
		condFn = $.isFunction(condFn) ? condFn : function () {
			return true;
		};

		var beforeVal = input.val() || '';
		setTimeout(function () {
			if (!condFn(input.val() || '')) {
				input.val(beforeVal);
			}
		}, 0);
	}

	//NOTE it is possible to make regex checks
	function checkText(text, chFn) {
		for (var i = 0; i < text.length; i++) {
			var ch = text.charCodeAt(i);
			if (!chFn(ch)) {
				return false;
			}
		}
		return true;
	}

	function createAutocompleteModel(tagsData) {
		var parentPath = [];
		return createTagsArray(tagsData);

		function createTagsArray(subtree, tagsArray) {
			tagsArray = tagsArray || [];

			for(var i = 0; i < subtree.length; i++ ){
				var item = subtree[i];

				tagsArray.push({
					value: item.name,
					label: item.title,
					parent: parentPath.join('/')
				});

				if (item.children) {
					parentPath.push(item.title);
					createTagsArray(item.children, tagsArray);
				}
			}
			parentPath.pop();
			return tagsArray;
		}
	}
	function createTagsTreeModel(tagsData) {
		var viewModel = {};
		var tagsHash = {};
		var path = [];
		var num = 0;

		convert(tagsData, 'root');

		return {
			vm: viewModel,
			hash: tagsHash
		};

		function convert(subtree, name) {
			if (subtree.length < 1)
				return;

			viewModel[name] = [];
			for (var i = 0; i< subtree.length; i++) {
				var item = subtree[i];
				var vm = {
					value: item.name,
					name: item.title,
					label: item.title,
					parent: path.join('/')
				};
				vm.path = combine(vm.parent, vm.label);
				tagsHash[vm.path] = vm;

				if (item.children) {
					var chName = 'ch' + num++;
					vm.children = chName;
					path.push(item.title);
					convert(item.children, chName);
				}
				viewModel[name].push(vm);
			}
			path.pop();
		}
	}
})();