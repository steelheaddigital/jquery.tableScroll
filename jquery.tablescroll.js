/*

Copyright (c) 2009 Dimas Begunoff, http://www.farinspace.com

Licensed under the MIT license
http://en.wikipedia.org/wiki/MIT_License

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

; (function ($) {

    var scrollbarWidth = 0;

    function getScrollbarWidth() {
        if (scrollbarWidth) return scrollbarWidth;
        var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-1000px;left:-1000px;"><div style="height:100px;"></div></div>');
        $('body').append(div);
        var w1 = $('div', div).innerWidth();
        div.css('overflow-y', 'auto');
        var w2 = $('div', div).innerWidth();
        scrollbarWidth = (w1 - w2);
        div.remove();
        div = null;

        return scrollbarWidth;
    }

    $.fn.tableScroll = function (options) {

        if (options == 'undo') {
            var container = $(this).parent().parent();
            if (container.hasClass('tablescroll_wrapper')) {
                container.find('.tablescroll_head thead').prependTo(this);
                container.find('.tablescroll_foot tfoot').appendTo(this);
                container.before(this);
                container.empty();
            }
            return;
        }

        var settings = $.extend({}, $.fn.tableScroll.defaults, options);

        settings.scrollbarWidth = getScrollbarWidth();

        if (settings.visibleRows !== null) {
            settings.height = getTableHeightByVisibleRows($(this));
        }

        function getTableHeightByVisibleRows(table) {
            var cloneContainer = $('<div id="CloneContainer" style="position: absolute; top:-1000px; left:-1000px;"></div>');
            var visibleRows = settings.visibleRows - 1;
            table.clone().appendTo(cloneContainer);
            $("table tbody tr:gt(" + visibleRows + ")", cloneContainer).remove();

            $('body').append(cloneContainer);
            var height = $("table tbody", cloneContainer).height();
            cloneContainer.remove();
            cloneContainer = null;

            return height;
        }


        var flush = settings.flush;
        var table = $(this);

        //Store the original list of classes on the table to add to the header and footer
        var classList = []
        var origClassList = table.attr('class').split(/\s+/);
        for (var i = 0, len = origClassList.length; i < len; i++) {
            var classValue = origClassList[i];
            var allowedClass = classValue.indexOf("tableScroll") === -1;

            //Don't include the classes added by the plugin
            if (allowedClass === true) {
                classList.push(classValue);
            }
            classValue = null;
            allowedClass = null;
        }
        origClassList = null;

        // find or create the wrapper div (allows tableScroll to be re-applied)
        var wrapper;
        if (table.parent().hasClass('tablescroll_wrapper')) {
            wrapper = table.parent();
        }
        else {
            wrapper = $('<div class="tablescroll_wrapper"></div>').insertBefore(table).append(table);

        }

        // check for a predefined container
        if (!wrapper.parent('div').hasClass(settings.containerClass)) {
            $('<div></div>').addClass(settings.containerClass).insertBefore(wrapper).append(wrapper);
        }

        var width = settings.width ? settings.width : table.outerWidth();

        wrapper.css({
            'width': width + 'px',
            'height': settings.height + 'px',
            'overflow': 'auto'
        });

        table.css('width', width + 'px');

        // with border difference
        var wrapper_width = wrapper.outerWidth();
        var diff = wrapper_width - width;
        var adjustedWrapperWidth;
        var adjustedWrapperHeight;

        var outerHeight = table.outerHeight();
        if (outerHeight <= settings.height && outerHeight > 0) {
            wrapper.css({ height: 'auto', width: (width - diff) + 'px' });
            adjustedWrapperWidth = (width - diff) + 'px'
            adjustedWrapperHeight = 'auto',
            flush = false;
        }
        else {
            adjustedWrapperWidth = ((width - diff) + settings.scrollbarWidth) + 'px',
            adjustedWrapperHeight = settings.height + 'px'
        }

        wrapper.css({
            'width': adjustedWrapperWidth,
            'height': adjustedWrapperHeight,
            'overflow': 'auto'
        });

        table.css('width', (width - diff) + 'px');

        //clone the table so that some operations can be done in memory instead of manipulating the DOM, helps performance
        var clone = table.clone(true).addClass('tablescroll_body');
        datePickers = null;

        // possible speed enhancements
        var has_thead = $('thead', clone).length ? true : false;
        var has_tfoot = $('tfoot', clone).length ? true : false;
        var thead_tr_first = $('thead tr:first', clone);
        var tbody_tr_first = $('tbody tr:first', clone);
        var tfoot_tr_first = $('tfoot tr:first', clone);

        //Get the thead from the table still in the DOM so widths are calculated correctly
        var thead = $('thead tr:first', table);

        // remember width of last cell
        var w = 0;

        var cells = $('th, td', thead)
        for (var i = 0, len = cells.length; i < len; i++) {
            w = $(cells[i]).width();
            var width = w + 'px';

            $('th:eq(' + i + '), td:eq(' + i + ')', thead_tr_first).css('width', width);
            $('th:eq(' + i + '), td:eq(' + i + ')', tbody_tr_first).css('width', width);
            if (has_tfoot) $('th:eq(' + i + '), td:eq(' + i + ')', tfoot_tr_first).css('width', width);
        }
        cells = null;

        if (has_thead) {
            var tbh = $('<table class="tablescroll_head" cellspacing="0"></table>').insertBefore(wrapper).prepend($('thead', clone));

            //Add the same classes here that were in the original table
            for (var i = 0, len = classList.length; i < len; i++) {
                tbh.addClass(classList[i]);
            }
        }

        if (has_tfoot) {
            var tbf = $('<table class="tablescroll_foot" cellspacing="0"></table>').insertAfter(wrapper).prepend($('tfoot', clone));

            //Add the same classes here that were in the original table
            for (var i = 0, len = classList.length; i < len; i++) {
                tbf.addClass(classList[i]);
            }
        }
            
        var wrapperWidth = wrapper.outerWidth();
        if (tbh != undefined) {
            tbh.css('width', width + 'px');

            if (flush) {
                $('tr:first th:last, tr:first td:last', tbh).css('width', (w + settings.scrollbarWidth) + 'px');
                tbh.css('width', wrapperWidth + 'px');
            }
        }

        if (tbf != undefined) {
            tbf.css('width', width + 'px');

            if (flush) {
                $('tr:first th:last, tr:first td:last', tbf).css('width', (w + settings.scrollbarWidth) + 'px');
                tbf.css('width', wrapperWidth + 'px');
            }
        }

        var newTable = table.replaceWith(clone);

        clone = null;
        container = null;
        thead = null;
        table = null;
        tbh = null;
        tbf = null;
        thead_tr_first = null;
        tbody_tr_first = null;
        tfoot_tr_first = null;

        return this;
    };

    // public
    $.fn.tableScroll.defaults =
	{
	    flush: true, // makes the last thead and tbody column flush with the scrollbar
	    width: null, // width of the table (head, body and foot), null defaults to the tables natural width
	    height: 100, // height of the scrollable area
	    containerClass: 'tablescroll', // the plugin wraps the table in a div with this css class
	    visibleRows: null
	};

})(jQuery);