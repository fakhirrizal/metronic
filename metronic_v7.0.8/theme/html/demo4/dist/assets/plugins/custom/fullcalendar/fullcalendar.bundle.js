/*!
FullCalendar Core Package v4.4.2
Docs & License: https://fullcalendar.io/
(c) 2019 Adam Shaw
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.FullCalendar = {}));
}(this, function (exports) { 'use strict';

    // Creating
    // ----------------------------------------------------------------------------------------------------------------
    var elementPropHash = {
        className: true,
        colSpan: true,
        rowSpan: true
    };
    var containerTagHash = {
        '<tr': 'tbody',
        '<td': 'tr'
    };
    function createElement(tagName, attrs, content) {
        var el = document.createElement(tagName);
        if (attrs) {
            for (var attrName in attrs) {
                if (attrName === 'style') {
                    applyStyle(el, attrs[attrName]);
                }
                else if (elementPropHash[attrName]) {
                    el[attrName] = attrs[attrName];
                }
                else {
                    el.setAttribute(attrName, attrs[attrName]);
                }
            }
        }
        if (typeof content === 'string') {
            el.innerHTML = content; // shortcut. no need to process HTML in any way
        }
        else if (content != null) {
            appendToElement(el, content);
        }
        return el;
    }
    function htmlToElement(html) {
        html = html.trim();
        var container = document.createElement(computeContainerTag(html));
        container.innerHTML = html;
        return container.firstChild;
    }
    function htmlToElements(html) {
        return Array.prototype.slice.call(htmlToNodeList(html));
    }
    function htmlToNodeList(html) {
        html = html.trim();
        var container = document.createElement(computeContainerTag(html));
        container.innerHTML = html;
        return container.childNodes;
    }
    // assumes html already trimmed and tag names are lowercase
    function computeContainerTag(html) {
        return containerTagHash[html.substr(0, 3) // faster than using regex
        ] || 'div';
    }
    function appendToElement(el, content) {
        var childNodes = normalizeContent(content);
        for (var i = 0; i < childNodes.length; i++) {
            el.appendChild(childNodes[i]);
        }
    }
    function prependToElement(parent, content) {
        var newEls = normalizeContent(content);
        var afterEl = parent.firstChild || null; // if no firstChild, will append to end, but that's okay, b/c there were no children
        for (var i = 0; i < newEls.length; i++) {
            parent.insertBefore(newEls[i], afterEl);
        }
    }
    function insertAfterElement(refEl, content) {
        var newEls = normalizeContent(content);
        var afterEl = refEl.nextSibling || null;
        for (var i = 0; i < newEls.length; i++) {
            refEl.parentNode.insertBefore(newEls[i], afterEl);
        }
    }
    function normalizeContent(content) {
        var els;
        if (typeof content === 'string') {
            els = htmlToElements(content);
        }
        else if (content instanceof Node) {
            els = [content];
        }
        else { // Node[] or NodeList
            els = Array.prototype.slice.call(content);
        }
        return els;
    }
    function removeElement(el) {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }
    // Querying
    // ----------------------------------------------------------------------------------------------------------------
    // from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
    var matchesMethod = Element.prototype.matches ||
        Element.prototype.matchesSelector ||
        Element.prototype.msMatchesSelector;
    var closestMethod = Element.prototype.closest || function (selector) {
        // polyfill
        var el = this;
        if (!document.documentElement.contains(el)) {
            return null;
        }
        do {
            if (elementMatches(el, selector)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
    function elementClosest(el, selector) {
        return closestMethod.call(el, selector);
    }
    function elementMatches(el, selector) {
        return matchesMethod.call(el, selector);
    }
    // accepts multiple subject els
    // returns a real array. good for methods like forEach
    function findElements(container, selector) {
        var containers = container instanceof HTMLElement ? [container] : container;
        var allMatches = [];
        for (var i = 0; i < containers.length; i++) {
            var matches = containers[i].querySelectorAll(selector);
            for (var j = 0; j < matches.length; j++) {
                allMatches.push(matches[j]);
            }
        }
        return allMatches;
    }
    // accepts multiple subject els
    // only queries direct child elements
    function findChildren(parent, selector) {
        var parents = parent instanceof HTMLElement ? [parent] : parent;
        var allMatches = [];
        for (var i = 0; i < parents.length; i++) {
            var childNodes = parents[i].children; // only ever elements
            for (var j = 0; j < childNodes.length; j++) {
                var childNode = childNodes[j];
                if (!selector || elementMatches(childNode, selector)) {
                    allMatches.push(childNode);
                }
            }
        }
        return allMatches;
    }
    // Attributes
    // ----------------------------------------------------------------------------------------------------------------
    function forceClassName(el, className, bool) {
        if (bool) {
            el.classList.add(className);
        }
        else {
            el.classList.remove(className);
        }
    }
    // Style
    // ----------------------------------------------------------------------------------------------------------------
    var PIXEL_PROP_RE = /(top|left|right|bottom|width|height)$/i;
    function applyStyle(el, props) {
        for (var propName in props) {
            applyStyleProp(el, propName, props[propName]);
        }
    }
    function applyStyleProp(el, name, val) {
        if (val == null) {
            el.style[name] = '';
        }
        else if (typeof val === 'number' && PIXEL_PROP_RE.test(name)) {
            el.style[name] = val + 'px';
        }
        else {
            el.style[name] = val;
        }
    }

    function pointInsideRect(point, rect) {
        return point.left >= rect.left &&
            point.left < rect.right &&
            point.top >= rect.top &&
            point.top < rect.bottom;
    }
    // Returns a new rectangle that is the intersection of the two rectangles. If they don't intersect, returns false
    function intersectRects(rect1, rect2) {
        var res = {
            left: Math.max(rect1.left, rect2.left),
            right: Math.min(rect1.right, rect2.right),
            top: Math.max(rect1.top, rect2.top),
            bottom: Math.min(rect1.bottom, rect2.bottom)
        };
        if (res.left < res.right && res.top < res.bottom) {
            return res;
        }
        return false;
    }
    function translateRect(rect, deltaX, deltaY) {
        return {
            left: rect.left + deltaX,
            right: rect.right + deltaX,
            top: rect.top + deltaY,
            bottom: rect.bottom + deltaY
        };
    }
    // Returns a new point that will have been moved to reside within the given rectangle
    function constrainPoint(point, rect) {
        return {
            left: Math.min(Math.max(point.left, rect.left), rect.right),
            top: Math.min(Math.max(point.top, rect.top), rect.bottom)
        };
    }
    // Returns a point that is the center of the given rectangle
    function getRectCenter(rect) {
        return {
            left: (rect.left + rect.right) / 2,
            top: (rect.top + rect.bottom) / 2
        };
    }
    // Subtracts point2's coordinates from point1's coordinates, returning a delta
    function diffPoints(point1, point2) {
        return {
            left: point1.left - point2.left,
            top: point1.top - point2.top
        };
    }

    // Logic for determining if, when the element is right-to-left, the scrollbar appears on the left side
    var isRtlScrollbarOnLeft = null;
    function getIsRtlScrollbarOnLeft() {
        if (isRtlScrollbarOnLeft === null) {
            isRtlScrollbarOnLeft = computeIsRtlScrollbarOnLeft();
        }
        return isRtlScrollbarOnLeft;
    }
    function computeIsRtlScrollbarOnLeft() {
        var outerEl = createElement('div', {
            style: {
                position: 'absolute',
                top: -1000,
                left: 0,
                border: 0,
                padding: 0,
                overflow: 'scroll',
                direction: 'rtl'
            }
        }, '<div></div>');
        document.body.appendChild(outerEl);
        var innerEl = outerEl.firstChild;
        var res = innerEl.getBoundingClientRect().left > outerEl.getBoundingClientRect().left;
        removeElement(outerEl);
        return res;
    }
    // The scrollbar width computations in computeEdges are sometimes flawed when it comes to
    // retina displays, rounding, and IE11. Massage them into a usable value.
    function sanitizeScrollbarWidth(width) {
        width = Math.max(0, width); // no negatives
        width = Math.round(width);
        return width;
    }

    function computeEdges(el, getPadding) {
        if (getPadding === void 0) { getPadding = false; }
        var computedStyle = window.getComputedStyle(el);
        var borderLeft = parseInt(computedStyle.borderLeftWidth, 10) || 0;
        var borderRight = parseInt(computedStyle.borderRightWidth, 10) || 0;
        var borderTop = parseInt(computedStyle.borderTopWidth, 10) || 0;
        var borderBottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
        // must use offset(Width|Height) because compatible with client(Width|Height)
        var scrollbarLeftRight = sanitizeScrollbarWidth(el.offsetWidth - el.clientWidth - borderLeft - borderRight);
        var scrollbarBottom = sanitizeScrollbarWidth(el.offsetHeight - el.clientHeight - borderTop - borderBottom);
        var res = {
            borderLeft: borderLeft,
            borderRight: borderRight,
            borderTop: borderTop,
            borderBottom: borderBottom,
            scrollbarBottom: scrollbarBottom,
            scrollbarLeft: 0,
            scrollbarRight: 0
        };
        if (getIsRtlScrollbarOnLeft() && computedStyle.direction === 'rtl') { // is the scrollbar on the left side?
            res.scrollbarLeft = scrollbarLeftRight;
        }
        else {
            res.scrollbarRight = scrollbarLeftRight;
        }
        if (getPadding) {
            res.paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
            res.paddingRight = parseInt(computedStyle.paddingRight, 10) || 0;
            res.paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
            res.paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
        }
        return res;
    }
    function computeInnerRect(el, goWithinPadding) {
        if (goWithinPadding === void 0) { goWithinPadding = false; }
        var outerRect = computeRect(el);
        var edges = computeEdges(el, goWithinPadding);
        var res = {
            left: outerRect.left + edges.borderLeft + edges.scrollbarLeft,
            right: outerRect.right - edges.borderRight - edges.scrollbarRight,
            top: outerRect.top + edges.borderTop,
            bottom: outerRect.bottom - edges.borderBottom - edges.scrollbarBottom
        };
        if (goWithinPadding) {
            res.left += edges.paddingLeft;
            res.right -= edges.paddingRight;
            res.top += edges.paddingTop;
            res.bottom -= edges.paddingBottom;
        }
        return res;
    }
    function computeRect(el) {
        var rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.pageXOffset,
            top: rect.top + window.pageYOffset,
            right: rect.right + window.pageXOffset,
            bottom: rect.bottom + window.pageYOffset
        };
    }
    function computeViewportRect() {
        return {
            left: window.pageXOffset,
            right: window.pageXOffset + document.documentElement.clientWidth,
            top: window.pageYOffset,
            bottom: window.pageYOffset + document.documentElement.clientHeight
        };
    }
    function computeHeightAndMargins(el) {
        return el.getBoundingClientRect().height + computeVMargins(el);
    }
    function computeVMargins(el) {
        var computed = window.getComputedStyle(el);
        return parseInt(computed.marginTop, 10) +
            parseInt(computed.marginBottom, 10);
    }
    // does not return window
    function getClippingParents(el) {
        var parents = [];
        while (el instanceof HTMLElement) { // will stop when gets to document or null
            var computedStyle = window.getComputedStyle(el);
            if (computedStyle.position === 'fixed') {
                break;
            }
            if ((/(auto|scroll)/).test(computedStyle.overflow + computedStyle.overflowY + computedStyle.overflowX)) {
                parents.push(el);
            }
            el = el.parentNode;
        }
        return parents;
    }
    function computeClippingRect(el) {
        return getClippingParents(el)
            .map(function (el) {
            return computeInnerRect(el);
        })
            .concat(computeViewportRect())
            .reduce(function (rect0, rect1) {
            return intersectRects(rect0, rect1) || rect1; // should always intersect
        });
    }

    // Stops a mouse/touch event from doing it's native browser action
    function preventDefault(ev) {
        ev.preventDefault();
    }
    // Event Delegation
    // ----------------------------------------------------------------------------------------------------------------
    function listenBySelector(container, eventType, selector, handler) {
        function realHandler(ev) {
            var matchedChild = elementClosest(ev.target, selector);
            if (matchedChild) {
                handler.call(matchedChild, ev, matchedChild);
            }
        }
        container.addEventListener(eventType, realHandler);
        return function () {
            container.removeEventListener(eventType, realHandler);
        };
    }
    function listenToHoverBySelector(container, selector, onMouseEnter, onMouseLeave) {
        var currentMatchedChild;
        return listenBySelector(container, 'mouseover', selector, function (ev, matchedChild) {
            if (matchedChild !== currentMatchedChild) {
                currentMatchedChild = matchedChild;
                onMouseEnter(ev, matchedChild);
                var realOnMouseLeave_1 = function (ev) {
                    currentMatchedChild = null;
                    onMouseLeave(ev, matchedChild);
                    matchedChild.removeEventListener('mouseleave', realOnMouseLeave_1);
                };
                // listen to the next mouseleave, and then unattach
                matchedChild.addEventListener('mouseleave', realOnMouseLeave_1);
            }
        });
    }
    // Animation
    // ----------------------------------------------------------------------------------------------------------------
    var transitionEventNames = [
        'webkitTransitionEnd',
        'otransitionend',
        'oTransitionEnd',
        'msTransitionEnd',
        'transitionend'
    ];
    // triggered only when the next single subsequent transition finishes
    function whenTransitionDone(el, callback) {
        var realCallback = function (ev) {
            callback(ev);
            transitionEventNames.forEach(function (eventName) {
                el.removeEventListener(eventName, realCallback);
            });
        };
        transitionEventNames.forEach(function (eventName) {
            el.addEventListener(eventName, realCallback); // cross-browser way to determine when the transition finishes
        });
    }

    var DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    // Adding
    function addWeeks(m, n) {
        var a = dateToUtcArray(m);
        a[2] += n * 7;
        return arrayToUtcDate(a);
    }
    function addDays(m, n) {
        var a = dateToUtcArray(m);
        a[2] += n;
        return arrayToUtcDate(a);
    }
    function addMs(m, n) {
        var a = dateToUtcArray(m);
        a[6] += n;
        return arrayToUtcDate(a);
    }
    // Diffing (all return floats)
    function diffWeeks(m0, m1) {
        return diffDays(m0, m1) / 7;
    }
    function diffDays(m0, m1) {
        return (m1.valueOf() - m0.valueOf()) / (1000 * 60 * 60 * 24);
    }
    function diffHours(m0, m1) {
        return (m1.valueOf() - m0.valueOf()) / (1000 * 60 * 60);
    }
    function diffMinutes(m0, m1) {
        return (m1.valueOf() - m0.valueOf()) / (1000 * 60);
    }
    function diffSeconds(m0, m1) {
        return (m1.valueOf() - m0.valueOf()) / 1000;
    }
    function diffDayAndTime(m0, m1) {
        var m0day = startOfDay(m0);
        var m1day = startOfDay(m1);
        return {
            years: 0,
            months: 0,
            days: Math.round(diffDays(m0day, m1day)),
            milliseconds: (m1.valueOf() - m1day.valueOf()) - (m0.valueOf() - m0day.valueOf())
        };
    }
    // Diffing Whole Units
    function diffWholeWeeks(m0, m1) {
        var d = diffWholeDays(m0, m1);
        if (d !== null && d % 7 === 0) {
            return d / 7;
        }
        return null;
    }
    function diffWholeDays(m0, m1) {
        if (timeAsMs(m0) === timeAsMs(m1)) {
            return Math.round(diffDays(m0, m1));
        }
        return null;
    }
    // Start-Of
    function startOfDay(m) {
        return arrayToUtcDate([
            m.getUTCFullYear(),
            m.getUTCMonth(),
            m.getUTCDate()
        ]);
    }
    function startOfHour(m) {
        return arrayToUtcDate([
            m.getUTCFullYear(),
            m.getUTCMonth(),
            m.getUTCDate(),
            m.getUTCHours()
        ]);
    }
    function startOfMinute(m) {
        return arrayToUtcDate([
            m.getUTCFullYear(),
            m.getUTCMonth(),
            m.getUTCDate(),
            m.getUTCHours(),
            m.getUTCMinutes()
        ]);
    }
    function startOfSecond(m) {
        return arrayToUtcDate([
            m.getUTCFullYear(),
            m.getUTCMonth(),
            m.getUTCDate(),
            m.getUTCHours(),
            m.getUTCMinutes(),
            m.getUTCSeconds()
        ]);
    }
    // Week Computation
    function weekOfYear(marker, dow, doy) {
        var y = marker.getUTCFullYear();
        var w = weekOfGivenYear(marker, y, dow, doy);
        if (w < 1) {
            return weekOfGivenYear(marker, y - 1, dow, doy);
        }
        var nextW = weekOfGivenYear(marker, y + 1, dow, doy);
        if (nextW >= 1) {
            return Math.min(w, nextW);
        }
        return w;
    }
    function weekOfGivenYear(marker, year, dow, doy) {
        var firstWeekStart = arrayToUtcDate([year, 0, 1 + firstWeekOffset(year, dow, doy)]);
        var dayStart = startOfDay(marker);
        var days = Math.round(diffDays(firstWeekStart, dayStart));
        return Math.floor(days / 7) + 1; // zero-indexed
    }
    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        var fwd = 7 + dow - doy;
        // first-week day local weekday -- which local weekday is fwd
        var fwdlw = (7 + arrayToUtcDate([year, 0, fwd]).getUTCDay() - dow) % 7;
        return -fwdlw + fwd - 1;
    }
    // Array Conversion
    function dateToLocalArray(date) {
        return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        ];
    }
    function arrayToLocalDate(a) {
        return new Date(a[0], a[1] || 0, a[2] == null ? 1 : a[2], // day of month
        a[3] || 0, a[4] || 0, a[5] || 0);
    }
    function dateToUtcArray(date) {
        return [
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        ];
    }
    function arrayToUtcDate(a) {
        // according to web standards (and Safari), a month index is required.
        // massage if only given a year.
        if (a.length === 1) {
            a = a.concat([0]);
        }
        return new Date(Date.UTC.apply(Date, a));
    }
    // Other Utils
    function isValidDate(m) {
        return !isNaN(m.valueOf());
    }
    function timeAsMs(m) {
        return m.getUTCHours() * 1000 * 60 * 60 +
            m.getUTCMinutes() * 1000 * 60 +
            m.getUTCSeconds() * 1000 +
            m.getUTCMilliseconds();
    }

    var INTERNAL_UNITS = ['years', 'months', 'days', 'milliseconds'];
    var PARSE_RE = /^(-?)(?:(\d+)\.)?(\d+):(\d\d)(?::(\d\d)(?:\.(\d\d\d))?)?/;
    // Parsing and Creation
    function createDuration(input, unit) {
        var _a;
        if (typeof input === 'string') {
            return parseString(input);
        }
        else if (typeof input === 'object' && input) { // non-null object
            return normalizeObject(input);
        }
        else if (typeof input === 'number') {
            return normalizeObject((_a = {}, _a[unit || 'milliseconds'] = input, _a));
        }
        else {
            return null;
        }
    }
    function parseString(s) {
        var m = PARSE_RE.exec(s);
        if (m) {
            var sign = m[1] ? -1 : 1;
            return {
                years: 0,
                months: 0,
                days: sign * (m[2] ? parseInt(m[2], 10) : 0),
                milliseconds: sign * ((m[3] ? parseInt(m[3], 10) : 0) * 60 * 60 * 1000 + // hours
                    (m[4] ? parseInt(m[4], 10) : 0) * 60 * 1000 + // minutes
                    (m[5] ? parseInt(m[5], 10) : 0) * 1000 + // seconds
                    (m[6] ? parseInt(m[6], 10) : 0) // ms
                )
            };
        }
        return null;
    }
    function normalizeObject(obj) {
        return {
            years: obj.years || obj.year || 0,
            months: obj.months || obj.month || 0,
            days: (obj.days || obj.day || 0) +
                getWeeksFromInput(obj) * 7,
            milliseconds: (obj.hours || obj.hour || 0) * 60 * 60 * 1000 + // hours
                (obj.minutes || obj.minute || 0) * 60 * 1000 + // minutes
                (obj.seconds || obj.second || 0) * 1000 + // seconds
                (obj.milliseconds || obj.millisecond || obj.ms || 0) // ms
        };
    }
    function getWeeksFromInput(obj) {
        return obj.weeks || obj.week || 0;
    }
    // Equality
    function durationsEqual(d0, d1) {
        return d0.years === d1.years &&
            d0.months === d1.months &&
            d0.days === d1.days &&
            d0.milliseconds === d1.milliseconds;
    }
    function isSingleDay(dur) {
        return dur.years === 0 && dur.months === 0 && dur.days === 1 && dur.milliseconds === 0;
    }
    // Simple Math
    function addDurations(d0, d1) {
        return {
            years: d0.years + d1.years,
            months: d0.months + d1.months,
            days: d0.days + d1.days,
            milliseconds: d0.milliseconds + d1.milliseconds
        };
    }
    function subtractDurations(d1, d0) {
        return {
            years: d1.years - d0.years,
            months: d1.months - d0.months,
            days: d1.days - d0.days,
            milliseconds: d1.milliseconds - d0.milliseconds
        };
    }
    function multiplyDuration(d, n) {
        return {
            years: d.years * n,
            months: d.months * n,
            days: d.days * n,
            milliseconds: d.milliseconds * n
        };
    }
    // Conversions
    // "Rough" because they are based on average-case Gregorian months/years
    function asRoughYears(dur) {
        return asRoughDays(dur) / 365;
    }
    function asRoughMonths(dur) {
        return asRoughDays(dur) / 30;
    }
    function asRoughDays(dur) {
        return asRoughMs(dur) / 864e5;
    }
    function asRoughMinutes(dur) {
        return asRoughMs(dur) / (1000 * 60);
    }
    function asRoughSeconds(dur) {
        return asRoughMs(dur) / 1000;
    }
    function asRoughMs(dur) {
        return dur.years * (365 * 864e5) +
            dur.months * (30 * 864e5) +
            dur.days * 864e5 +
            dur.milliseconds;
    }
    // Advanced Math
    function wholeDivideDurations(numerator, denominator) {
        var res = null;
        for (var i = 0; i < INTERNAL_UNITS.length; i++) {
            var unit = INTERNAL_UNITS[i];
            if (denominator[unit]) {
                var localRes = numerator[unit] / denominator[unit];
                if (!isInt(localRes) || (res !== null && res !== localRes)) {
                    return null;
                }
                res = localRes;
            }
            else if (numerator[unit]) {
                // needs to divide by something but can't!
                return null;
            }
        }
        return res;
    }
    function greatestDurationDenominator(dur, dontReturnWeeks) {
        var ms = dur.milliseconds;
        if (ms) {
            if (ms % 1000 !== 0) {
                return { unit: 'millisecond', value: ms };
            }
            if (ms % (1000 * 60) !== 0) {
                return { unit: 'second', value: ms / 1000 };
            }
            if (ms % (1000 * 60 * 60) !== 0) {
                return { unit: 'minute', value: ms / (1000 * 60) };
            }
            if (ms) {
                return { unit: 'hour', value: ms / (1000 * 60 * 60) };
            }
        }
        if (dur.days) {
            if (!dontReturnWeeks && dur.days % 7 === 0) {
                return { unit: 'week', value: dur.days / 7 };
            }
            return { unit: 'day', value: dur.days };
        }
        if (dur.months) {
            return { unit: 'month', value: dur.months };
        }
        if (dur.years) {
            return { unit: 'year', value: dur.years };
        }
        return { unit: 'millisecond', value: 0 };
    }

    /* FullCalendar-specific DOM Utilities
    ----------------------------------------------------------------------------------------------------------------------*/
    // Given the scrollbar widths of some other container, create borders/margins on rowEls in order to match the left
    // and right space that was offset by the scrollbars. A 1-pixel border first, then margin beyond that.
    function compensateScroll(rowEl, scrollbarWidths) {
        if (scrollbarWidths.left) {
            applyStyle(rowEl, {
                borderLeftWidth: 1,
                marginLeft: scrollbarWidths.left - 1
            });
        }
        if (scrollbarWidths.right) {
            applyStyle(rowEl, {
                borderRightWidth: 1,
                marginRight: scrollbarWidths.right - 1
            });
        }
    }
    // Undoes compensateScroll and restores all borders/margins
    function uncompensateScroll(rowEl) {
        applyStyle(rowEl, {
            marginLeft: '',
            marginRight: '',
            borderLeftWidth: '',
            borderRightWidth: ''
        });
    }
    // Make the mouse cursor express that an event is not allowed in the current area
    function disableCursor() {
        document.body.classList.add('fc-not-allowed');
    }
    // Returns the mouse cursor to its original look
    function enableCursor() {
        document.body.classList.remove('fc-not-allowed');
    }
    // Given a total available height to fill, have `els` (essentially child rows) expand to accomodate.
    // By default, all elements that are shorter than the recommended height are expanded uniformly, not considering
    // any other els that are already too tall. if `shouldRedistribute` is on, it considers these tall rows and
    // reduces the available height.
    function distributeHeight(els, availableHeight, shouldRedistribute) {
        // *FLOORING NOTE*: we floor in certain places because zoom can give inaccurate floating-point dimensions,
        // and it is better to be shorter than taller, to avoid creating unnecessary scrollbars.
        var minOffset1 = Math.floor(availableHeight / els.length); // for non-last element
        var minOffset2 = Math.floor(availableHeight - minOffset1 * (els.length - 1)); // for last element *FLOORING NOTE*
        var flexEls = []; // elements that are allowed to expand. array of DOM nodes
        var flexOffsets = []; // amount of vertical space it takes up
        var flexHeights = []; // actual css height
        var usedHeight = 0;
        undistributeHeight(els); // give all elements their natural height
        // find elements that are below the recommended height (expandable).
        // important to query for heights in a single first pass (to avoid reflow oscillation).
        els.forEach(function (el, i) {
            var minOffset = i === els.length - 1 ? minOffset2 : minOffset1;
            var naturalHeight = el.getBoundingClientRect().height;
            var naturalOffset = naturalHeight + computeVMargins(el);
            if (naturalOffset < minOffset) {
                flexEls.push(el);
                flexOffsets.push(naturalOffset);
                flexHeights.push(naturalHeight);
            }
            else {
                // this element stretches past recommended height (non-expandable). mark the space as occupied.
                usedHeight += naturalOffset;
            }
        });
        // readjust the recommended height to only consider the height available to non-maxed-out rows.
        if (shouldRedistribute) {
            availableHeight -= usedHeight;
            minOffset1 = Math.floor(availableHeight / flexEls.length);
            minOffset2 = Math.floor(availableHeight - minOffset1 * (flexEls.length - 1)); // *FLOORING NOTE*
        }
        // assign heights to all expandable elements
        flexEls.forEach(function (el, i) {
            var minOffset = i === flexEls.length - 1 ? minOffset2 : minOffset1;
            var naturalOffset = flexOffsets[i];
            var naturalHeight = flexHeights[i];
            var newHeight = minOffset - (naturalOffset - naturalHeight); // subtract the margin/padding
            if (naturalOffset < minOffset) { // we check this again because redistribution might have changed things
                el.style.height = newHeight + 'px';
            }
        });
    }
    // Undoes distrubuteHeight, restoring all els to their natural height
    function undistributeHeight(els) {
        els.forEach(function (el) {
            el.style.height = '';
        });
    }
    // Given `els`, a set of <td> cells, find the cell with the largest natural width and set the widths of all the
    // cells to be that width.
    // PREREQUISITE: if you want a cell to take up width, it needs to have a single inner element w/ display:inline
    function matchCellWidths(els) {
        var maxInnerWidth = 0;
        els.forEach(function (el) {
            var innerEl = el.firstChild; // hopefully an element
            if (innerEl instanceof HTMLElement) {
                var innerWidth_1 = innerEl.getBoundingClientRect().width;
                if (innerWidth_1 > maxInnerWidth) {
                    maxInnerWidth = innerWidth_1;
                }
            }
        });
        maxInnerWidth++; // sometimes not accurate of width the text needs to stay on one line. insurance
        els.forEach(function (el) {
            el.style.width = maxInnerWidth + 'px';
        });
        return maxInnerWidth;
    }
    // Given one element that resides inside another,
    // Subtracts the height of the inner element from the outer element.
    function subtractInnerElHeight(outerEl, innerEl) {
        // effin' IE8/9/10/11 sometimes returns 0 for dimensions. this weird hack was the only thing that worked
        var reflowStyleProps = {
            position: 'relative',
            left: -1 // ensure reflow in case the el was already relative. negative is less likely to cause new scroll
        };
        applyStyle(outerEl, reflowStyleProps);
        applyStyle(innerEl, reflowStyleProps);
        var diff = // grab the dimensions
         outerEl.getBoundingClientRect().height -
            innerEl.getBoundingClientRect().height;
        // undo hack
        var resetStyleProps = { position: '', left: '' };
        applyStyle(outerEl, resetStyleProps);
        applyStyle(innerEl, resetStyleProps);
        return diff;
    }
    /* Selection
    ----------------------------------------------------------------------------------------------------------------------*/
    function preventSelection(el) {
        el.classList.add('fc-unselectable');
        el.addEventListener('selectstart', preventDefault);
    }
    function allowSelection(el) {
        el.classList.remove('fc-unselectable');
        el.removeEventListener('selectstart', preventDefault);
    }
    /* Context Menu
    ----------------------------------------------------------------------------------------------------------------------*/
    function preventContextMenu(el) {
        el.addEventListener('contextmenu', preventDefault);
    }
    function allowContextMenu(el) {
        el.removeEventListener('contextmenu', preventDefault);
    }
    /* Object Ordering by Field
    ----------------------------------------------------------------------------------------------------------------------*/
    function parseFieldSpecs(input) {
        var specs = [];
        var tokens = [];
        var i;
        var token;
        if (typeof input === 'string') {
            tokens = input.split(/\s*,\s*/);
        }
        else if (typeof input === 'function') {
            tokens = [input];
        }
        else if (Array.isArray(input)) {
            tokens = input;
        }
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (typeof token === 'string') {
                specs.push(token.charAt(0) === '-' ?
                    { field: token.substring(1), order: -1 } :
                    { field: token, order: 1 });
            }
            else if (typeof token === 'function') {
                specs.push({ func: token });
            }
        }
        return specs;
    }
    function compareByFieldSpecs(obj0, obj1, fieldSpecs) {
        var i;
        var cmp;
        for (i = 0; i < fieldSpecs.length; i++) {
            cmp = compareByFieldSpec(obj0, obj1, fieldSpecs[i]);
            if (cmp) {
                return cmp;
            }
        }
        return 0;
    }
    function compareByFieldSpec(obj0, obj1, fieldSpec) {
        if (fieldSpec.func) {
            return fieldSpec.func(obj0, obj1);
        }
        return flexibleCompare(obj0[fieldSpec.field], obj1[fieldSpec.field])
            * (fieldSpec.order || 1);
    }
    function flexibleCompare(a, b) {
        if (!a && !b) {
            return 0;
        }
        if (b == null) {
            return -1;
        }
        if (a == null) {
            return 1;
        }
        if (typeof a === 'string' || typeof b === 'string') {
            return String(a).localeCompare(String(b));
        }
        return a - b;
    }
    /* String Utilities
    ----------------------------------------------------------------------------------------------------------------------*/
    function capitaliseFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function padStart(val, len) {
        var s = String(val);
        return '000'.substr(0, len - s.length) + s;
    }
    /* Number Utilities
    ----------------------------------------------------------------------------------------------------------------------*/
    function compareNumbers(a, b) {
        return a - b;
    }
    function isInt(n) {
        return n % 1 === 0;
    }
    /* Weird Utilities
    ----------------------------------------------------------------------------------------------------------------------*/
    function applyAll(functions, thisObj, args) {
        if (typeof functions === 'function') { // supplied a single function
            functions = [functions];
        }
        if (functions) {
            var i = void 0;
            var ret = void 0;
            for (i = 0; i < functions.length; i++) {
                ret = functions[i].apply(thisObj, args) || ret;
            }
            return ret;
        }
    }
    function firstDefined() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        for (var i = 0; i < args.length; i++) {
            if (args[i] !== undefined) {
                return args[i];
            }
        }
    }
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    // https://github.com/jashkenas/underscore/blob/1.6.0/underscore.js#L714
    function debounce(func, wait) {
        var timeout;
        var args;
        var context;
        var timestamp;
        var result;
        var later = function () {
            var last = new Date().valueOf() - timestamp;
            if (last < wait) {
                timeout = setTimeout(later, wait - last);
            }
            else {
                timeout = null;
                result = func.apply(context, args);
                context = args = null;
            }
        };
        return function () {
            context = this;
            args = arguments;
            timestamp = new Date().valueOf();
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            return result;
        };
    }
    // Number and Boolean are only types that defaults or not computed for
    // TODO: write more comments
    function refineProps(rawProps, processors, defaults, leftoverProps) {
        if (defaults === void 0) { defaults = {}; }
        var refined = {};
        for (var key in processors) {
            var processor = processors[key];
            if (rawProps[key] !== undefined) {
                // found
                if (processor === Function) {
                    refined[key] = typeof rawProps[key] === 'function' ? rawProps[key] : null;
                }
                else if (processor) { // a refining function?
                    refined[key] = processor(rawProps[key]);
                }
                else {
                    refined[key] = rawProps[key];
                }
            }
            else if (defaults[key] !== undefined) {
                // there's an explicit default
                refined[key] = defaults[key];
            }
            else {
                // must compute a default
                if (processor === String) {
                    refined[key] = ''; // empty string is default for String
                }
                else if (!processor || processor === Number || processor === Boolean || processor === Function) {
                    refined[key] = null; // assign null for other non-custom processor funcs
                }
                else {
                    refined[key] = processor(null); // run the custom processor func
                }
            }
        }
        if (leftoverProps) {
            for (var key in rawProps) {
                if (processors[key] === undefined) {
                    leftoverProps[key] = rawProps[key];
                }
            }
        }
        return refined;
    }
    /* Date stuff that doesn't belong in datelib core
    ----------------------------------------------------------------------------------------------------------------------*/
    // given a timed range, computes an all-day range that has the same exact duration,
    // but whose start time is aligned with the start of the day.
    function computeAlignedDayRange(timedRange) {
        var dayCnt = Math.floor(diffDays(timedRange.start, timedRange.end)) || 1;
        var start = startOfDay(timedRange.start);
        var end = addDays(start, dayCnt);
        return { start: start, end: end };
    }
    // given a timed range, computes an all-day range based on how for the end date bleeds into the next day
    // TODO: give nextDayThreshold a default arg
    function computeVisibleDayRange(timedRange, nextDayThreshold) {
        if (nextDayThreshold === void 0) { nextDayThreshold = createDuration(0); }
        var startDay = null;
        var endDay = null;
        if (timedRange.end) {
            endDay = startOfDay(timedRange.end);
            var endTimeMS = timedRange.end.valueOf() - endDay.valueOf(); // # of milliseconds into `endDay`
            // If the end time is actually inclusively part of the next day and is equal to or
            // beyond the next day threshold, adjust the end to be the exclusive end of `endDay`.
            // Otherwise, leaving it as inclusive will cause it to exclude `endDay`.
            if (endTimeMS && endTimeMS >= asRoughMs(nextDayThreshold)) {
                endDay = addDays(endDay, 1);
            }
        }
        if (timedRange.start) {
            startDay = startOfDay(timedRange.start); // the beginning of the day the range starts
            // If end is within `startDay` but not past nextDayThreshold, assign the default duration of one day.
            if (endDay && endDay <= startDay) {
                endDay = addDays(startDay, 1);
            }
        }
        return { start: startDay, end: endDay };
    }
    // spans from one day into another?
    function isMultiDayRange(range) {
        var visibleRange = computeVisibleDayRange(range);
        return diffDays(visibleRange.start, visibleRange.end) > 1;
    }
    function diffDates(date0, date1, dateEnv, largeUnit) {
        if (largeUnit === 'year') {
            return createDuration(dateEnv.diffWholeYears(date0, date1), 'year');
        }
        else if (largeUnit === 'month') {
            return createDuration(dateEnv.diffWholeMonths(date0, date1), 'month');
        }
        else {
            return diffDayAndTime(date0, date1); // returns a duration
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function parseRecurring(eventInput, allDayDefault, dateEnv, recurringTypes, leftovers) {
        for (var i = 0; i < recurringTypes.length; i++) {
            var localLeftovers = {};
            var parsed = recurringTypes[i].parse(eventInput, localLeftovers, dateEnv);
            if (parsed) {
                var allDay = localLeftovers.allDay;
                delete localLeftovers.allDay; // remove from leftovers
                if (allDay == null) {
                    allDay = allDayDefault;
                    if (allDay == null) {
                        allDay = parsed.allDayGuess;
                        if (allDay == null) {
                            allDay = false;
                        }
                    }
                }
                __assign(leftovers, localLeftovers);
                return {
                    allDay: allDay,
                    duration: parsed.duration,
                    typeData: parsed.typeData,
                    typeId: i
                };
            }
        }
        return null;
    }
    /*
    Event MUST have a recurringDef
    */
    function expandRecurringRanges(eventDef, duration, framingRange, dateEnv, recurringTypes) {
        var typeDef = recurringTypes[eventDef.recurringDef.typeId];
        var markers = typeDef.expand(eventDef.recurringDef.typeData, {
            start: dateEnv.subtract(framingRange.start, duration),
            end: framingRange.end
        }, dateEnv);
        // the recurrence plugins don't guarantee that all-day events are start-of-day, so we have to
        if (eventDef.allDay) {
            markers = markers.map(startOfDay);
        }
        return markers;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    // Merges an array of objects into a single object.
    // The second argument allows for an array of property names who's object values will be merged together.
    function mergeProps(propObjs, complexProps) {
        var dest = {};
        var i;
        var name;
        var complexObjs;
        var j;
        var val;
        var props;
        if (complexProps) {
            for (i = 0; i < complexProps.length; i++) {
                name = complexProps[i];
                complexObjs = [];
                // collect the trailing object values, stopping when a non-object is discovered
                for (j = propObjs.length - 1; j >= 0; j--) {
                    val = propObjs[j][name];
                    if (typeof val === 'object' && val) { // non-null object
                        complexObjs.unshift(val);
                    }
                    else if (val !== undefined) {
                        dest[name] = val; // if there were no objects, this value will be used
                        break;
                    }
                }
                // if the trailing values were objects, use the merged value
                if (complexObjs.length) {
                    dest[name] = mergeProps(complexObjs);
                }
            }
        }
        // copy values into the destination, going from last to first
        for (i = propObjs.length - 1; i >= 0; i--) {
            props = propObjs[i];
            for (name in props) {
                if (!(name in dest)) { // if already assigned by previous props or complex props, don't reassign
                    dest[name] = props[name];
                }
            }
        }
        return dest;
    }
    function filterHash(hash, func) {
        var filtered = {};
        for (var key in hash) {
            if (func(hash[key], key)) {
                filtered[key] = hash[key];
            }
        }
        return filtered;
    }
    function mapHash(hash, func) {
        var newHash = {};
        for (var key in hash) {
            newHash[key] = func(hash[key], key);
        }
        return newHash;
    }
    function arrayToHash(a) {
        var hash = {};
        for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
            var item = a_1[_i];
            hash[item] = true;
        }
        return hash;
    }
    function hashValuesToArray(obj) {
        var a = [];
        for (var key in obj) {
            a.push(obj[key]);
        }
        return a;
    }
    function isPropsEqual(obj0, obj1) {
        for (var key in obj0) {
            if (hasOwnProperty.call(obj0, key)) {
                if (!(key in obj1)) {
                    return false;
                }
            }
        }
        for (var key in obj1) {
            if (hasOwnProperty.call(obj1, key)) {
                if (obj0[key] !== obj1[key]) {
                    return false;
                }
            }
        }
        return true;
    }

    function parseEvents(rawEvents, sourceId, calendar, allowOpenRange) {
        var eventStore = createEmptyEventStore();
        for (var _i = 0, rawEvents_1 = rawEvents; _i < rawEvents_1.length; _i++) {
            var rawEvent = rawEvents_1[_i];
            var tuple = parseEvent(rawEvent, sourceId, calendar, allowOpenRange);
            if (tuple) {
                eventTupleToStore(tuple, eventStore);
            }
        }
        return eventStore;
    }
    function eventTupleToStore(tuple, eventStore) {
        if (eventStore === void 0) { eventStore = createEmptyEventStore(); }
        eventStore.defs[tuple.def.defId] = tuple.def;
        if (tuple.instance) {
            eventStore.instances[tuple.instance.instanceId] = tuple.instance;
        }
        return eventStore;
    }
    function expandRecurring(eventStore, framingRange, calendar) {
        var dateEnv = calendar.dateEnv;
        var defs = eventStore.defs, instances = eventStore.instances;
        // remove existing recurring instances
        instances = filterHash(instances, function (instance) {
            return !defs[instance.defId].recurringDef;
        });
        for (var defId in defs) {
            var def = defs[defId];
            if (def.recurringDef) {
                var duration = def.recurringDef.duration;
                if (!duration) {
                    duration = def.allDay ?
                        calendar.defaultAllDayEventDuration :
                        calendar.defaultTimedEventDuration;
                }
                var starts = expandRecurringRanges(def, duration, framingRange, calendar.dateEnv, calendar.pluginSystem.hooks.recurringTypes);
                for (var _i = 0, starts_1 = starts; _i < starts_1.length; _i++) {
                    var start = starts_1[_i];
                    var instance = createEventInstance(defId, {
                        start: start,
                        end: dateEnv.add(start, duration)
                    });
                    instances[instance.instanceId] = instance;
                }
            }
        }
        return { defs: defs, instances: instances };
    }
    // retrieves events that have the same groupId as the instance specified by `instanceId`
    // or they are the same as the instance.
    // why might instanceId not be in the store? an event from another calendar?
    function getRelevantEvents(eventStore, instanceId) {
        var instance = eventStore.instances[instanceId];
        if (instance) {
            var def_1 = eventStore.defs[instance.defId];
            // get events/instances with same group
            var newStore = filterEventStoreDefs(eventStore, function (lookDef) {
                return isEventDefsGrouped(def_1, lookDef);
            });
            // add the original
            // TODO: wish we could use eventTupleToStore or something like it
            newStore.defs[def_1.defId] = def_1;
            newStore.instances[instance.instanceId] = instance;
            return newStore;
        }
        return createEmptyEventStore();
    }
    function isEventDefsGrouped(def0, def1) {
        return Boolean(def0.groupId && def0.groupId === def1.groupId);
    }
    function transformRawEvents(rawEvents, eventSource, calendar) {
        var calEachTransform = calendar.opt('eventDataTransform');
        var sourceEachTransform = eventSource ? eventSource.eventDataTransform : null;
        if (sourceEachTransform) {
            rawEvents = transformEachRawEvent(rawEvents, sourceEachTransform);
        }
        if (calEachTransform) {
            rawEvents = transformEachRawEvent(rawEvents, calEachTransform);
        }
        return rawEvents;
    }
    function transformEachRawEvent(rawEvents, func) {
        var refinedEvents;
        if (!func) {
            refinedEvents = rawEvents;
        }
        else {
            refinedEvents = [];
            for (var _i = 0, rawEvents_2 = rawEvents; _i < rawEvents_2.length; _i++) {
                var rawEvent = rawEvents_2[_i];
                var refinedEvent = func(rawEvent);
                if (refinedEvent) {
                    refinedEvents.push(refinedEvent);
                }
                else if (refinedEvent == null) {
                    refinedEvents.push(rawEvent);
                } // if a different falsy value, do nothing
            }
        }
        return refinedEvents;
    }
    function createEmptyEventStore() {
        return { defs: {}, instances: {} };
    }
    function mergeEventStores(store0, store1) {
        return {
            defs: __assign({}, store0.defs, store1.defs),
            instances: __assign({}, store0.instances, store1.instances)
        };
    }
    function filterEventStoreDefs(eventStore, filterFunc) {
        var defs = filterHash(eventStore.defs, filterFunc);
        var instances = filterHash(eventStore.instances, function (instance) {
            return defs[instance.defId]; // still exists?
        });
        return { defs: defs, instances: instances };
    }

    function parseRange(input, dateEnv) {
        var start = null;
        var end = null;
        if (input.start) {
            start = dateEnv.createMarker(input.start);
        }
        if (input.end) {
            end = dateEnv.createMarker(input.end);
        }
        if (!start && !end) {
            return null;
        }
        if (start && end && end < start) {
            return null;
        }
        return { start: start, end: end };
    }
    // SIDE-EFFECT: will mutate ranges.
    // Will return a new array result.
    function invertRanges(ranges, constraintRange) {
        var invertedRanges = [];
        var start = constraintRange.start; // the end of the previous range. the start of the new range
        var i;
        var dateRange;
        // ranges need to be in order. required for our date-walking algorithm
        ranges.sort(compareRanges);
        for (i = 0; i < ranges.length; i++) {
            dateRange = ranges[i];
            // add the span of time before the event (if there is any)
            if (dateRange.start > start) { // compare millisecond time (skip any ambig logic)
                invertedRanges.push({ start: start, end: dateRange.start });
            }
            if (dateRange.end > start) {
                start = dateRange.end;
            }
        }
        // add the span of time after the last event (if there is any)
        if (start < constraintRange.end) { // compare millisecond time (skip any ambig logic)
            invertedRanges.push({ start: start, end: constraintRange.end });
        }
        return invertedRanges;
    }
    function compareRanges(range0, range1) {
        return range0.start.valueOf() - range1.start.valueOf(); // earlier ranges go first
    }
    function intersectRanges(range0, range1) {
        var start = range0.start;
        var end = range0.end;
        var newRange = null;
        if (range1.start !== null) {
            if (start === null) {
                start = range1.start;
            }
            else {
                start = new Date(Math.max(start.valueOf(), range1.start.valueOf()));
            }
        }
        if (range1.end != null) {
            if (end === null) {
                end = range1.end;
            }
            else {
                end = new Date(Math.min(end.valueOf(), range1.end.valueOf()));
            }
        }
        if (start === null || end === null || start < end) {
            newRange = { start: start, end: end };
        }
        return newRange;
    }
    function rangesEqual(range0, range1) {
        return (range0.start === null ? null : range0.start.valueOf()) === (range1.start === null ? null : range1.start.valueOf()) &&
            (range0.end === null ? null : range0.end.valueOf()) === (range1.end === null ? null : range1.end.valueOf());
    }
    function rangesIntersect(range0, range1) {
        return (range0.end === null || range1.start === null || range0.end > range1.start) &&
            (range0.start === null || range1.end === null || range0.start < range1.end);
    }
    function rangeContainsRange(outerRange, innerRange) {
        return (outerRange.start === null || (innerRange.start !== null && innerRange.start >= outerRange.start)) &&
            (outerRange.end === null || (innerRange.end !== null && innerRange.end <= outerRange.end));
    }
    function rangeContainsMarker(range, date) {
        return (range.start === null || date >= range.start) &&
            (range.end === null || date < range.end);
    }
    // If the given date is not within the given range, move it inside.
    // (If it's past the end, make it one millisecond before the end).
    function constrainMarkerToRange(date, range) {
        if (range.start != null && date < range.start) {
            return range.start;
        }
        if (range.end != null && date >= range.end) {
            return new Date(range.end.valueOf() - 1);
        }
        return date;
    }

    function removeExact(array, exactVal) {
        var removeCnt = 0;
        var i = 0;
        while (i < array.length) {
            if (array[i] === exactVal) {
                array.splice(i, 1);
                removeCnt++;
            }
            else {
                i++;
            }
        }
        return removeCnt;
    }
    function isArraysEqual(a0, a1) {
        var len = a0.length;
        var i;
        if (len !== a1.length) { // not array? or not same length?
            return false;
        }
        for (i = 0; i < len; i++) {
            if (a0[i] !== a1[i]) {
                return false;
            }
        }
        return true;
    }

    function memoize(workerFunc) {
        var args;
        var res;
        return function () {
            if (!args || !isArraysEqual(args, arguments)) {
                args = arguments;
                res = workerFunc.apply(this, arguments);
            }
            return res;
        };
    }
    /*
    always executes the workerFunc, but if the result is equal to the previous result,
    return the previous result instead.
    */
    function memoizeOutput(workerFunc, equalityFunc) {
        var cachedRes = null;
        return function () {
            var newRes = workerFunc.apply(this, arguments);
            if (cachedRes === null || !(cachedRes === newRes || equalityFunc(cachedRes, newRes))) {
                cachedRes = newRes;
            }
            return cachedRes;
        };
    }

    var EXTENDED_SETTINGS_AND_SEVERITIES = {
        week: 3,
        separator: 0,
        omitZeroMinute: 0,
        meridiem: 0,
        omitCommas: 0
    };
    var STANDARD_DATE_PROP_SEVERITIES = {
        timeZoneName: 7,
        era: 6,
        year: 5,
        month: 4,
        day: 2,
        weekday: 2,
        hour: 1,
        minute: 1,
        second: 1
    };
    var MERIDIEM_RE = /\s*([ap])\.?m\.?/i; // eats up leading spaces too
    var COMMA_RE = /,/g; // we need re for globalness
    var MULTI_SPACE_RE = /\s+/g;
    var LTR_RE = /\u200e/g; // control character
    var UTC_RE = /UTC|GMT/;
    var NativeFormatter = /** @class */ (function () {
        function NativeFormatter(formatSettings) {
            var standardDateProps = {};
            var extendedSettings = {};
            var severity = 0;
            for (var name_1 in formatSettings) {
                if (name_1 in EXTENDED_SETTINGS_AND_SEVERITIES) {
                    extendedSettings[name_1] = formatSettings[name_1];
                    severity = Math.max(EXTENDED_SETTINGS_AND_SEVERITIES[name_1], seΚ�� W4a�L䉀�G@Ě�]��$}t����ݎ���F÷;K�NH3^x��x�=:��ϗ�V�k���eI��k��&���ԃՐd�a���ྦྷ����no�_��(�!kZ؆�ۃ2 e�x�}O���#6w)B��/!�b��� r_�B�L�BI^X?p��e*��r�My3xe()���~�R�ԕ���s@k�঳�d�b�g[��B��q�����W�Îu���* ���(���5������(F=1¹-cD��J�F
ϑpF�I�����9��4��`A���G�!�Tl�Õ8bl�������G�Z�#�TZt��]j�#/]��2 �$c����D�j	v3�/5T���2J3���Vl��=��	ƓA�\|�9R(q�ʧ��1P�#ⵙ�˗4�V�l��.��lד;\���n�|�j���pv��� И�ƶ^g�����R�]�;�r4� p���nG�翹b[��95��bWU=��9-�k�$����uH��S]U�1����vhA�[d(���U�|\k��o3#�^�e��14� l�Qt1y�����ՍF�,8��Fn�}IQ��`�'��n� �Zc�Oc�����6�5џ��#�]M�sw�{&��#a  )%fh��������~��y��mL���3'�N\vmv&�e���;�˷����z��Z-z>5W�9�d�e'�`�s�!���iS�u���jk��s��h��K�����Lnq t�e����Bݓ�v�8�)] ��k;Z�Q�=� t�[7��v�j�[� ���me&�m���������B!>��
�ӓg�{��dw��[�oF6���)�;���î��ߙ�>/�-����b@����H:��$"���+���&��gl[���m�=�#;����>m(J�U���+�mA�;�Fym���L��*M�S}��;�q���+�a�*y"� 7b_���&X�U<�,Hۍ�S���p�AŲVù�����s�JU%m��9O�1Ď4�I�� ��y~چÈ��O�qNG�:hP<���8�"�8�����'�'��	��P�T�SD�	��	�`��Ƒ3UI*�>�5�!q�u�lD��s���G����Z@8\=��CZ���CE+1ޛJ�ς�qO��K.��,D!W>	֓�G��y9R?���|�g�"�����7���u��ة �k{v'�诺d[�7�T+�¹��J4gU}��CN���W��'KU�l}Q�$A\�Z淵�GM}�>s�� �f-�	�'�f�e	qQ�»�����;�q���ǻݞ5�����{lB7�����w(q�3^ϗ�㤭Y�x�}k�]O��͢�b���,m�+;f�F�k�2+�n�,��u�*�]�i�z#�ӒV-������0	T��q��q�{E6�A�(JeP�* '��8r�MY� \��*W��@�%�Qpq�T�È�u� �*�yV���qԭ$������;f��}Nz�*G�gfRDG[\����	
1$�s�\��Tʘۜ��R]��׺��$1�I�08c�U�1������@�&l.st��O X��F�w$�ѷy�W<l�^���J�ѩo�7d'��h�,�����K��k���h.cZ��z���h��ȼ$$򢠮��o�1~�^�ҏ�����O3[��)՜��K=�v.аa
#5�Һk�b]{{�WԻ�aQ��!�׍�l�{yyR�6�6,c��Z�Ut0yn����+�}�dK�Q} }�)H����ƘŤ����n����D����(�E�@�� vH��n��{�$�D�%�Z�ܛljnp�o���1��aQ��D�K9��+8�e�)��&��v�ڊ$�#�%����J0��7�k�,�����4��K��������͂G*� ����/�U��I�G���Ǖ���HvW��w�R����3�s��:+�5֣,�S�,x�$�Pe�m���O��/vkZ�1�c=h�H!BW��DrY�=�� �ålܣ�<���q��c$;I������񬕡%ݚ)՟�v͹���7���t-��k^�ZK]�PAƻ|��/���I��y����cr���/����Zѻm��{����v1�=.��8=���?%��[W�)����K�Y���J=��{A�p�=6a�~����I"-����ǒq���&iA�����wsyk��5(iqhշ����d�"
��ߍѧ�� ������N��4�/��]�*���̀��N2��pv��� m+���)'��mo�]����/"?�_��wF�}�,�Tw�.�ۘ�>�V����M�qm����"h��ƢՍƜ�[�P	l���q�5�qr,�S��>��6�L`�W/0��LP/L(#2 �	��:�!q8
	�Ö\�J7Z0�D�	 S���D�a�cLP8.��i��%��9 �q�4�aÂ�5�2(�4�D���<���fIʘ)gϟX>�6���g�O���w[�P�0�c�K��)�|��}��}L�kd(�M{��"�R�O�U&_}�����v&�˵D��̞i���ޥ�4GFciB�8��Z��u�u�c�Nķ�VV���z���fZ�f5�v�]MX?�t/sκ�?l�.p��V��V��|�t��cӁ+�\k���^�:��]�E&���#�(-s��/ѣ����ᤖ��{{Ve�U�<��wM� �Q�\���z�5�p�k"������&��;ÑoVtW.7�DR �J�l�Se����IĨCשּׁX���������Ҁ!H�����I���+�	Y\IR �yW�W�_[oq�Dl�}.��	u8믷�[�s[�o�Ӈ�6�Q`���WU<lU�s[����Yڶ0�-�za[*Ql�w��+vh"�azV��&�����4䂜����\Bh�@�@���r z(p�(����J@^��Z$�|=�H��q>�$��^�� � t\h "� 7J��h C��#x�05�O\������_�I���U���[�tv[�l��V�����V��h��U�)����Mm�����%q�>�\��ovgw�����d��m�m�{d�8ܮn8�δ�iI>�<<u]I���7[��J���Z pţ�Z�i6�x�6I�LvU���e_TH�gWkɥ��剺pTɌdp@��5ϐ֥b�.����4� 
�2Z��.�]��W�� d�n-��{{Ʀ@L�8dpg�|Zj�����S�������޿��]�`�.��  �+S<V{vǷX�]���J��9�@<*)��z#O�����$�n��d�[���*��ξ%6��u���	�����	�k"y�' *8s|h�fwj���_�}:�X72#��9�����`���̻�������s�	]�D� ���N���'���9���������7�Qq�5��R�um��55�/��u͑壇^��t��h-�ݬ�ž�~��zm+��B�u��i�M]�^��o�s;����@���]��s����KT�������kg���f\�̱Huz�����k��I�{�Gќf��79��,e�
H�� S�nv����Wyva�����Wt��S���NZ�-�p�� �Jm��}�{���^^����U[Df7z�h��.�(0����L#�T��7����b�.�+����������P�ۗkYL�o{w{Hz�j�� ��8֟P����� ޮ�.�]��W�˩�,�Cof���7d���y�x�T�?��r+Z*A����{c����F���A� 5�BO45��uh�Fޕx̞��}|�]�4z[���� �ܷI&���ڳ��Ywwj_�>�{��pI�{H�0RS����h?-�������NEv鴷;�`K3?m1ĕ�;�����gy�f��jks����ju�� �����8"Ws�{����VIoX͹N2{ƈׁ5H��ǉ�/�N��IO�9�����l��?����r�ͩZ�,��?�������V��@hB׽��o��=�kN����;#��i�h�m�L�S��3$��NET��}|h5�.�@�Z�L�� o=���} ^���
  �B�UZ���Bb��q�1�S?�HHk�i8�xq�j�u!u�:6��c��k�"�̆M��ʱ���r���m�tW��_�V�b�~ iZ巵�}���uԁݿG�ȏ�X[�1=�ھ�);�e���&|���mcu���V�ٸ��-!���n�S���¥�g�������xm�͌�a�5���V�F���^�����wX����s��Ⱥ���n��mۮ؞9�\s�6[�ud�c߶5�@³��%w� ��j?jA�J@Vv�rL8�LPB��ʉ@���dF�/u1A��G�!A�p���1�8t�1�#��C}<���c��؜*XA����j���?����n�ύK(��,�oct71�H�1
��P�L�>��Q�W�����[\bV$iSƩeuB�*�����;�c���W�l01�����+e����la�qn�A� ����Kk�4�����F�A&��v]��r�?G�Bݻxx���LR<~h�pƯ}��um6g�XoVW��KW�j~_ӋH�d��1z�����Ϛ�5�Fs�f�j���(�%��������dq �g`�x������6�&�cm�\�$�v��O5pJ�����mc�vG���֏H�?ekf� �����);׿����`l,�wI�dA�ƈ��6����k��I�������
Z��'������.tC�Ǖ`��u,E�6(�1��4��(\�:����q��.%f��X�Zih�� ��4�f��A�zk�k�rc���? �iIde,(�n��N��׃�8��򞂇���H�n��\˂��|�C?�«�}�x�9����!BC�F��=V���?{lh�G�慭*�4z��`���g�-�p�mY8�J͹f�A�{���l`*�Y]�:q�΅���c�#�UTʮM�n���{qV�U���l�{��G�RfI(%ب��ʐ�<Ҭ�!{A �v#
i��kr4�I�
�;!�c�:\�	N�Eb�J���Vs�h&����3ؙ#�}KHu4]�\�Mh���n�W_m$�F�BHw��՚�c�z����JY�U]WB���w��ء���!:��k;�����M�������f��~i�P���.H�~��;m>�﻽Ǧ��	�ன7����}��O�P�m��溾�^ ��8��m�ㅼ6z�[��;Cc�lL	�� i�n/�#\���;�N���NFH!�rT���M@�~�O��"pƁ49��&�9�JB~�?1+��B1�������NT �UE#J@pn*��4H ����$`! �
fE0�xq�JD7KW�
�O��@@�p{)�iE�+�@���W�a�<��6g�e����H��WM�t�q�
��{�����.o¶͢1���'\�2v�\�'�^�/t����&ok��m�-~��4�������#'����b��>����ڽ>�u�_՞˹wt�h�pd�$c�n�,�qg;�Ju��N�n�{���c�Xߴ����>�i?��/�)y�?��w�� ϵ�q��
�\��1�m//"�3�e�w�ѕ��թ�]p��k{m�4��_Ԛ������L[�A�Z�����o-zW��oԍii8���������롺�c���A�عEg�|ǲ�����@R�����S�A��S,�DN���T�pB�'��)'Z�r�S�ܷ���������a�3ND0��^)Ƥ$���:g@ʲZ��NK71Zƅ\Ͼ��dn]�g���.����+�RpR�2�/����~�3o-�e��ſ�b+etd���3��#�j/,�,O�@@�qJ��q�=��ճ�  {�nh�v�v��IĽ�	��-�>�q����K�^�n������ �R�hj~�w_�.��	�Λg�������?�&d}��}]�7���n �/�f���`!g�r�/lq�x�o��m%붩����|�n��UK7X}4�C_&�dw����`;r���Չj�]�竨=/�a�� �;hh�sϬf�hZ֏k��dV�΁��GcIb�|�̑�>ʞE/����;EA������e��|_q����0��W��a=�sO�No��l{|��p	)��Ɨ�������@��ݏ�@����~����9�a�0�1�H����zG�Η�Y�ܤ��b��,��S�tDJ�ћs�:l�)=�d3����R�ؖ����c`��^;���WƇGeUr*�(�u���L���<ӹ�c��9�j����W�͓�n�	�w�ܨ �kG�Z,pcl��� �[�I�+o�s ^|*�s?Q�����+��yp�ELQ~������C{�f5���0W3�?��+%��E�O�ø?�%Ќ��@��Sx��+ԙ�ߏ�p��!���4b���V�]���kth�� ���uw+���y�J��/�7�?ƎɌ�p�)�u;���z��	a]ٽi�?�%�;�S�jƣհ�*���˵OOg�ţ*9۹|+�ܷ�.߷)�|��T�T"�}��4�v���2˅(�{�hG$�(Ia�k"��t� H�D|�h����3�"Vӧ�A$�P
`�bX0��{M I���4�'�J�b5\�CGw)
��$�ʉ��,�	ڜ�Å0Hb.#�:E�.\� ���XP ��<� ����#��7ϥnl��k�-'�E+������#�o�j�����[{��Fg�~f��νL~�˱����e����ߙ�+������
�c:�_��7�0B*וW�9��^�TfK3���8刭�S�B����� �^�c�y ֞U뵚�L/���T����T�����w됟��.Wm=�:�S�9m���G��v����۹����U��º����UO�0�����u;m���t�7�ܷ�qtx�{�.���aoo��m����P})�s{iw�Jqs�{�{��+������o%�� ��E���}<܀;W}�i!�+�#� 0��œn6�L��^���I�m���4?k߶��3�ax���O�Soޯ�
��Z����6���3ő��fH�5�o����^fe�'��;�dj������ ~���Es�l��i�/p���_ar��k� �6�n]��pc��C\�����oO7��4[g���#O�G¹-��tu���#~��x�N�t*Q���Ԍ�&�������qJ ��y�!}���PWu���?c!}�
�+�fJၤ�"�),��I�(-X����4�#�rbn��ڛ�7-��`s.`\z�|���I�1�����^�m&���i��� �*U��FotP�~�n]��6寈|�]@�?�M�������m�VM�Z܁ŞC�Z����������l�촵�M_�N���݊�;��Gj<Uq�P�ӹ/%��2.w�������+W��]I�2=�\���҉�P)���>��4��X T�$?��ڻ����$mp��§�ƶE�Y�'�����'8~R}����d?A���������8|�R~S�5�.��]���W��8���?�Y��z��Ƿ��`���\H4�{���t/E��b����\B�ʡ�r�:�4#��?��03QQ��ʄZ���ٌv�n$�hJ[IlNݦ6��QU 09&kX�<�T)%n�J�0�¦1�ۀ���PX�mj�WO�E%�X5U0eZD�#m�C1D�[�pè�� ~��<�g�D���fF8��(��fh	���9�C#1�I�� �e��1�:	�41
/�9�1����% ���'Zbhx�p��(����-. {�<) ����q8r�@C��� %qHD�@+�  ���zaI��t&<jdbӆ9�Ft� @3Ğ4H�?Ӳ��-�9��\}����ɕ�gmp����wNU�@�17n��/Ô��ZZ8��*֨5��'�{-�>��2
�J
n��h5��k���]�lI�-�H(\�}ⶮK�hɵq[���vE����WL5݋�̏>�6&dM؁�X�1D�t�p���r[¯FQ��K�?��l����+���^�K�6�̋���an���3��~f7�;x�C}��2D���smv�-^��,��W��''���B�6�-��͉���7"��}���KW�m}�=�RۤΫi���O���l�;��GH^�:��{��]9J���;{~��������M��g�ܘߘO%��鯸��V�塓�Z�oo��m�{.guvM����B�|s���4�j��� ��_�[��6���}��o,7=�s���=�i�+��n7�� ���;W� ���lz>������� c���w�����^�ƴV��ɐ�cӝ���'�lvr�[E��������,a���,5�y�n�jq��z>;��ʷV�lS�}��G2}������U/ԧ~FZ��?"�LQwisl��ї7�ը~�?KL�ޥ�&��p��:c��<�ם� 2V�2.���q>��c�asd� ����]n������[���V|Z4VEw��H���ׅ +�k!pZP9!;q��I��
 i���B�<)$�q�֔Jr�j�c�eR��*�ć>xQIF�o��Pn>�	����	�\���I0Dl|��N�#v�P�\�c�IHiۉBp��$ofhU�H�`ѐˁ�J w���A6`��%|}ԇ!-Px����m
��G��U�g�iB�"�Ͷj���
G6 ʣ�&�l\�2��D
GcT)���((�DW��O�L$"4 A#�s��)hLQi	�t�hn��{(����sK�xc@ 4����N��ও h �=:��O,����@8q P�c���F*=�����	�46	9p�ΦF bpⴤ��B�K�A�W�9q�l��ZI�,�dp8D�0�iH�=݅�[���=o�Z���mL7���m��͔���-���|g���<G�o��=-�ݳE�х$ThR�6 ����#�����S��ڽ���Y0!��2ӈ&��C
�c��F�\��
!�8�d��]��}	���V�4����۷�#B�p$�MsU�C�F%�-�I�����+���f��1�p�0��ks-� +WE]��d/ۧw�l��1`�\��'G�˻�Q+���=O*�d|+Z�\z�x���&�dR浭i�j�]�]N{x	��}<�pw�3ZG�W��n���>�ɹ�}�'K� Eu��q3��ݑ�������WM|�v�r�ú�ݳܴjsHh�P!m��`�D�DԠsN��d�鳣������Q�{k��=�b�{[�� �t�+��fD�Y��� ���~=���Ou���u{W�	��c�>뺸��]k�2�U�Ψ��V/�k��o�'��_����=���u`���0��֋�(��� ���2/��V�eʫ��;ͯ���ˍ,�~̑���{$(�[����޿s��6�<��R߇�;����� ww��[4�#,o`S��k��E^�k� �W�G-���X���=#d����|hwn�B�%���,���(Z�V��
��k�<����u�� tvv��.�m۝���-*?�ƹ�Lk륫��'U2]�K���$�;�.���3Z�i�?�^�X~��f߸�]�?i�>�v�5��;�������YNa�҅$��i���?��C�<t��4��/��7dn�Ӷ��;������ �y�W=��57�����/s�}7��Q�6�H�$!�1�=�8�+b�z���ey6���aʎ�J��+�o�SI]�^�JJ���Ǝ!%)���u�*Z*J�m'���$�v����$��q�ʃ�L��n(N������bG�RФo���RH$c�؄㈪�Z��-(	���#i�Dan c�P�. `�1� ��#@H} �r��#�P�,r����@��� zg�͆<0��P`t�{cR�>t� 3��(h�h�Y����\0� V��`po���4`�j@pb*P�2�� �1��Jm����u20��f�� @���jyZ8-���?/�f��ґ�V{;�� �u@3�?�m��ݛW��g1�}O�=��v��nz���� 1�Jv��w_���g���?ӫ9��n�'�ђ\/��ƭ,��<~`��y�����#zSڝ�x�߄s�5��Nj�5�M?�z��-4��v3�t�  {��}�m�UkK�e �aY;`[�\ڵ��U��3_��x�� ��=�n�������)S��W��K��G��f��������EB�H�|b�R�B���&�4�J(�µY*���ntQ�) OU����i&5�6�>��>$:79+Z��PM7p�G��m �v�1�TԠ�"2A~Z�y��$�-�U	��ӷK'hs�+�z�U*&.L]�F��l��G�.Y� -[-�he�5��sl,z�q'<<j�k-�.����F5�̼���K���7�l�*2��� ?�[I����r��*ֻ	�Z��ig(o��9�c��n	I3PmVѳYkZIC��nMR*I�	�|�H�N\��i!D���ר�G:�O�����A�ֽ�6����4��s���c�J�@=k���Z���E���%��0�N����9b]S9o����Ϥ��#P>�9a�+���_�X9_�ߡ�y���ԋS#@Ei��[��p>�co-z3���RkI C	_�t�;�h�~=���v׎�H�`G�u��e�23��y�-p ��,ˡ�o���ex�g��"�и�1�@�꧛��^��9/���_t��?ȏ�]���w^O�ӻ�p���]5�,�x��Tb���]���:�����۰�L�Z_�j.t��q>`AT��g6�_޿�߇M����X� ���w��M�ss�i�c�3�i�릞z_�_����y=���R� :�t�g��;��|���N>i����kz���Wb�=5��-C̷�Qj�����~��Dؾ��3�4�����m�<����y<Lw�z���t�g� q%����9rW��W�`��������]�ٽ�m�Kcp�� ђv�� -;b����� Y|ʽ-�� >T��=���m޾�O,_�m�p������_\������ �h����O�k�6���� ���nH߬���#��j�d��L����w���o���+��*�ujږ�R^������Cv����Ȑ����<���|�ߞ��������~>O��i�v9$`�2�qc���"��6�޲&T�e��	�*]\�U�Z�DW~ڪt��*/J �� a�4��-!����P@�3�/ZPDm1DZ c��	@�<h���^@�g��/�!����xaM �x��Ǖ0����) ��rǅ ~�) �̸�<�hC�
 sO��{��4��>XPP4�W* :NcƔ��RW4�J@�rJ@ ֩
��S#D�mד���Y:�7c�J�[=��%Կlo���'�̽�o�j�+����-3����x�>��?B�z�,���S��[��*�}��qz˱(�К���y��g�=o�$�}xA��Z����=��F?]v1w��;�뵴s��ˀ���X������G�y�p� ��[7GX�O�m�sP��S�������N�/��_J�~Î�� �����?Q�w�~hm�~�	�5�¥x|>��|�����o�
�� �������;�ٙ�����Rd����4:)=S�u.?�v��t��|��7 �x��?�U�����6w�6����0�[}f�����7������q���:��ٙR��/�v��3\F�u�JM�in�;� �O��Q�@��aY	� �+j��m�Y���U����^���:P�9uJf%��x�Ԟ�&h�o0]B�I�-{Kp�<R��'V]l�n�,.������� �o9T-�(�ې��B�#Z�Q�I�dZ�f�Ì���%�ˋ�."5^YƴW���m�D�$��;O��3T�W$�eI� g��M���F�^�9�[� �1�/�-7KI�Lz]o.N�p���-F�+�]hl���Xɚ55��d��T���nm��/m���ّ�VvĞ����V���$e�k$�)"{C�^�ʲt�e&��.�gut덲�M���б<�V��S7U2���mq����K�ݷ$ޢ��7Եoy��@���|�q*������]Q��"i`�q�us��&�s�"f��Q0(��\�Kc�Е�Y-��wV��x�^r�)k�pC�p���u��mm�3��SFh=��fZ�x�(����$BK�  ��ғF�w�b��s�AZpD�e]vn�s�sc�~tW�JV�����[F��^�'��Wұ13aS�м�"��NkxX���ܾ�m�#v�w.�4��.A8Wb�<�&�aol�ٜ���=�&귒	2/v���:�r��,�i�}��v��5��g�G���޾��+#��U�ɺ��`� r�VQ\��f?%Y���|��`�`qPNUҳp)K��Q�rpӗ����\_ACkqe ��i��>Y"�Ѹ�+Z�3[6������4v/Տ����c������Dn#0� K�
�^fT�����;��t�|�=d� 1��l�6}��v�`���$� ��&�ys�V���Oď��_s:�?��w�����~˼����5�C̏Y�������~V8��j��Z_�]N�f�  ?Ƌ�?nzO��M��!���<�o�J�^�f��?�� ��~ύ9Tu���~�lS>�ne����M�o��%�p6����P1���k���Zc��_?�e��rW��[��c�}O���t�ww������k-�� ����=钟-W�Uo孯���5̶{��E�.�~���&��;�kv��a�Ϯ�x�zd��T�^_�_�����U� V;6�� �-���`�n�=ߤ?��왉� 5/���o���� �R�]mO�U� #Gmﯦ;�j��Y_��-�pLO� Ӕ�� 
��joW��Ӌ�pd�o_���#vwO����B�Y$Oi�Kci���J�J+K�N����EG_$S�n �ӎj1�2��������� 4���)��bU@)˅KZ�>����(L(�tN��z$�� =���i�=<z���p\�TȆ�P��ʉ4n+Ǎ&���62�F�=��5���`��fϴ����[z��Nt��εX��O%Q�g���I��%�؂�b���V���}�o�;�3�Y\]V�EЗ{>��6�lX�:4/��cbB7  �� >�?�/�)zc�� zt60�@ibp�� ��cb�#t�J$f$�a@�o�,�cf���Z$o����:���~��!��G�{g����m���}KM�R�NMe�ƻ���#�j�b�v훂�k����� ����%1i�Ͷ���k�4%�	���09-~_iG�$Ϛ(C-� �ְ���JM�n�m`�8@��v�5(�-BI�S,�scq���]�����B��U��bȮ�����t��V8k�� ���W<*��E	�%���3r.ī�UNu�d�gZǸ�5�{p}9�M���d��Z���A�ݾF�(7�$^P�A�*���g��%m�);d�����G�m�����s������1�V�B��;��X���xܡ���G3�M*���ƶo�Q:K���0�^��q�*�p��S[R[c��"��T�OF'x��ܭ��v:{(nZ?;Hl�|9W6\.�sZ�I`�u���[�m<�Ar54���gNKSj�kbgo{������ � ~���s���f�/thE�6��1�9�I	�W*�.�h�Κ���in�5Z���^�� �ÓZY��^�Z6��hG���OJ��iY!~�f�&f;S� +\WW�~I�9�D1��qD_0��2-�)&s�,������k")˷�Z�K���L�EdC����W�$���@�ڃަ�1�����@��lq����k��-����lI�V���˷:�DC��KB㘬-����L��{m�_��@�]G^�\�E��V�������:�@mtع�z�_r�]=�Ȧ�c��ߊ�hr��D&���%�3��+����N[�Wfsw�L7�g�����X�
���X^�v���hf5�e�Vz����P��'º��5���5w��>� z>71�/����O!]Jg%���HC�U
�ܜke���)ͳ+�~����>5^�%ъɛ���6�q5���Y���+��E�� -��L-����gs�}d���lg�~��}6�lw	��#�}�ֽ�.ͫ�&s[ã�G�C�v?�O�N҃tnݼ�P�btìj+U���X���2~%��n�_���]�[�_�V{����V��uv-tc�1-���s�<����/�Z�;Oտ�#r��۸�m����K�7����{�]��L�� ڿ�q[�h��M>�������d�z$�?�[��݃-�[�-�0�4^B$��Z�%�<v� ������E���\����i� ���{K��ɸZ\m������;� �Y^�?U/O��Ī���7��j�;����d�߾���ݫ��w�[�� ��j�|k��������:��W|r��"	~��m����{����rٮ����6�� 5�o�շ���k��筫��.�Q����N���C�%7,��yzs�޿��=�=7��?���a�E���'R͙�Q�9"��w�,25�>a\V��᝕�[j�Zm�阺�d
�Vi�%�-(��BT����� JT���b8R�*�H�]���0���ơ����z���J����v����K[wJ>����Z|��Wm��Ws�ۻ�2%�'7�J�ש��ºk�-�9푽���m��n�+x�o����e���rΚ$�� H�iJp!j�0�q�� � � � ��TR��R�R���R��c#p�H����3�lZ\`{Y�3�x#�Ț����w��hf��N�6�׳6���rZ��7-c|��A!C�fY:�)9,\G��s�y������a�a�Z��ք��盶�B�^q�"���_�1+w$|��PD��F���2G�99��8p�^���]1�f���n��\88Pi�������\��sF��F�4��$Пb���D� ��qiɯUa�G�Z,�hO�)d�=:fs�q@ǴI^
�NHeO�v;�̑C��e���%m��L�6����N�_�Ƅ4=�+��9����-	J��(�I4i�7�1�>�^� v �	Ja�O�6�H��,��ǉF�d�ߑ�ӓ>��pc�As+�]7+���Iʺ�z5�F6��[~�y�E �d�M`��V7fx
Y0R���KWsto�^��G%�m�As��7�3��8W��Kc��Er�|΃o�M����rt.{N�.��='%sT����rr�|��y�~+�t6����@/�|N�.����Z��|+�x�c�����:y��C,ۍ��F�-�{ǿӵ�)O�Q0����~��.��ݖ���6�7Ch��Ҏ3H� ⠊o��g�Y,�,2OX-����p �_uW�����8�ǘC�`@aB�b3\hYC�m�"HP�7�(.8����e̷,k�6�'��ƪ١wd�	�����b4b��7
q��$j�B�ݧT� a�G�R�4'�|J�\�9��r.O;P�P�Hk����B絨�B��.d J�(���uhi:
!2u�T�b�����0�5G���V92�������)�'��D�~:�91�.Ύ�p�1��)��©c��8�4���w�� h������Z��1ā�,Ư_"�Uٍ�lVި���C�����-��C\$��ν�M{3��f��*����<��2F�����I�yI��{����g%��t������v�������v��15����ۑmŻ��п�|Ώ-b5j�Nmvc��k��翉��Z�9�G����g��5�\�r[��,w��h���[��O�7o�!�p��>+Z&�t,ط�����&�{h�����hZ<�uuc�rQ�f������O�;M��_�N�-�x^�6|�^�X����Z��uj�4��o��3�6��/�v�@�c�w�V7۟���?�U�q��Q���n��N�� ���}kc�� ��v�$�L��\F�����}.��9��6O	�u[|�=�՟�Gq�O'hnݡ|�_w�Owb#q�G�&���Wr�,��g��� �ⷷVg��o�z?o�ӽ�7������S�#��e���i�p�Q� �*��ޘ�� W���ǵ�_��=m�����w�hw�$�����xj������glxV;�����[�_M�g� %��������Mlo�����t����b?�V��m�����$��U�\�W_̯w�;��[���˨f,�ۮ�7���x�e�� �!�;*���/�3�ܾ�������N�a�c0���T?
��_�鯖���� �p{�Տ������.�;p�o�{uN��3a����l�1^��6a����wp�E�l��act���M�����m�n �.Aμ�_R�V]�_�v5Ƽ�8_�g��<���o[wȷ���:.�۽V�p� 6I�\;���':诅�9m��^�q�o2�BJ���Oy�����;[HYom�14G85� ]�C��(% $�����H����J@4�*`)� �L�bi�4�ȧ���>��̂ݘ�Y�#`�q����i����.�{�߻�h�x¾���L-�B�-�z7[���y���p}�=�${�rLߑ�v��4���s�Z�Z7.��R����� 5_ 'g�I�7 �c�&���Ccz{��践~�j��ꕿ�� s��������ő���K�#���=Z>�U�e�{�ן�.��"�X55�a�.U�jQ���$��.&����k����
�.�Ѐ�Y�P���w�B\C]<�09�;Ac*�'ƏI�Y�{���t̆�?Sb.����s�*�F�d��f�w�Ѫ� :�<�Z:�^J ��-�lY��v�ckO'�\V�2�U��}���˯#� \�XϨ2,p�GƢ5�2��-,]1�� A�����ȩV��Tv���ݺX]�C�Y%����e�d�u����Bf}�W��"$�������ե9�m�cY���Kqt���/��+��cZR;
�k�[]�A�:��do��e��:�6FlR��"q��4�z�:-[t@�d}��^��$mܠj{O�x�J�Z>��_�	|����dor�1G[���73�TF�c7�F�����<NF�j�u�N
�M;K����o^�B�:H�nY�u�գD�L�����k�i"�V�Hn��]���������4Y��[�6���\�#�q�y1ӆ/h�k�?����1�*w�t�]�b�`�.c����+¿�֮q�Vzk��r5��)��E�@$�&��!�qh��K��c�]�&;lOxo7rYI
�kv��%�P�ʩ�TRI�K��R�����5���=@9�pkĄ�#�\n�V�{<�*8�5/B�!���M&W�.��*<s���Q�e��F��舺��G�i�-��챱�92��$eC�GQ�l�2pK4{����� �9���ɔF.$h"G���ZK��Jp6�%ܭle��8������7�i�PA%���ˈЊA�?W�> ��������uc�u�mD�&W���PcK\0C���L���RIZ$-�B5��p�Nu�$h�FZ�<��<���+�8�##ʝX�F�&�V���yZ ���ǉ�ZFmz-�'fz] �tA�s[-I�wgkz��Ղ��/<N���֮ͅ�[n��w���f�du[���w��͍O)����p����q��j�!%���1�zn�O�]U����G���Q�q�vo� ���b�\� {k����5�9_�ߣF�ӝ��9%��րb�╤{�)]������k�VU�~LƗg��\l����i8p��*yt��_y�o�ެ�x��Ԩ ��+�eFco&��!C���o\��<L�l�rӮ'<;�M(�j+^u0x�eՇ��湶-M�W�5�p����}�=����6��?S�)���w�vF|��#s����[���3�U���;?ʯ�{?�;'gsaޟ�1�4~�k_��پ���L�����=#�6����N�$p���5�K�m\�g�gm?R�?����[���\2��DZ���r鍍{�rh5��je���N�[&:ΐ~�}(�am�׷㵺��|5��p܀�nf��Bܣ����j뎔Ҋ�|�ɭ����� * T �P�� Ԡ@
�B 7�x�@쏧��;׸l6+S���G�5��ѭ5IW��Z=w��ړK-�����;�嚃o�?�m�� ��4�<c�\���VH駍�i��W�� �����'��F��g��D�o�[���<��� �imy9=�
�S��� ]O�_����?�y���0wκ���߻��C��ܯ�(�X�Hh��d�l��I~'}}������,��:;k��m�}� �R�&�/�f���觋��U�q,	�LL`0!��+�����I-��n.w���̒��:7��R�G��yݠ�;���8yt����$�����<[PUv�=���od�c��9���?���%m`#��ⲉ�z�{��S� ~`P�xVv����Z��䎚�v9����?�(�X��:h|��D�m�K�����$t:h���Y��3H?�����q�%H�[<&^��R���|��0#�]<#]���|���c�2jl���� ��S�U�����,e��X��{��ű��&���@��S��c���G~�5�N'���B�GEm��;H�n�%����a���E#K�p��=C���V�Y|Hy�����u��<	���G+ULy=B8��?�B��P6NW,��� P�V���qŬL� �������_����[�����Q��#�����S_WM�YԈ�i�
6�� �Δc�����o�9�F_��������̾}S="�?L�H%���'n�WɃ��;���z����qW����?���e�WO��uS2�/��ȅ��V7��67[����1�֒�N��ǲ)�9=0#d�CW'p<�>R�u0��L-�Q��c�2T�§��6[j6+6����v�(C�Z%bd<��=�)g�~F8Y�0M+�7h��5�Z�J�{?�FD.��x�l�]1�x`?3KH'�DVV���G���`�3������Z���u���[kR�ur�o!6�͒�7$�JR2�א��\��Y��`��{�[��,n%d2�s=R���ә�^v_-�C���o�7[{4�1ͺ�&��!F)�.6[�:5��dpk�3}?��^K�0�Ew3d�Jc�m�Fyt0�"�I�����\6wHǌX3'ګK@R��F��d�)��Rn6*��w��"�N�޵�R@��I��a���> )���$�����w1�O"�8�ST��|^��^��̏i���-7-y�F�F-`
��QY)��s�;إk$̒�c�/N�ރ�����uEh���m�x����o�rZ� �s�"���j���(��&���%�kBڵ�ӃKA~>�zt#^������G�99� 7�Wm
;�s��"����:K�Ʀ����V��ֱ"�"�k�$$sL7IYN+VN����F\�9�RTP�S��+�\m1JP�r�Ч����S�_i��-�$����7!ߥ�%�9�o�Wt/�����W�O���p>�`��gw�Iox׻� �Lh�v�]8��=\^�>����Ok2���N�t�6FD}IHw�!�_�����n�F��q������@��:݆@OM9�]����O���.�	~���:n��k�?�p�\�o�؞�}�/ƺެ�� �i���->��~�U�F�ћ�~�������M��.�]�H.lv����y]s3[)j�K|	�_��Uhi�?��p���J��}�^��
� * T �P�@
� ( P\CAs�5�\� U!nxW�?���7c�K��Wsw�u��/n7���PY��&�����պ�������p��O�����|�ݟ^���>�V�v�L�nS���z^�n�r}ÂF��ц^W��1iO�� ���O[�w���ڿ�c���ׂ�M�t�Gq�!���ξ��UTy-Q��3{�|�G�|?��S�Ĝ�l�?��~�lQ�ؘ�k4�@�Zl���MUBЦ�����Nt�v+?r�p�8"�@�ݹ7�ïJ \���`�H��V�O2���#�E�rZk������66�����as�'3�+�}4�h����Ѵٻ��d���#\��4�8���C�6C\��4�}�^e�/�Մ�G\\�4ze
uО>��M�Q��(�Lw���-lm+�\U�zU���F娷��8E&�#�u2鲸;�~EA�Vo���H�����{#g��k�8;����t�-��lxl����+%��m��Ί�ݩ��B�(8cZ����޲R~��^��
ꄠ,iB�h<��V�6Tt�J]$�8AF�5'"38UAｲ�F�$Sހ>R2�M6Si��S��n�FҌ��:��F�&��\�G&� �=����ڎ�8��(Jo�Y����#����� j`��!*?)@���ŗ���Q��l7��e�#t���Is��2�3�ZV��R-z2H;r�x���F�"��,`Ү�)R�5������!F���r�n����s�CBa�����N)_jɎ_�������F�ws��kN�=���v�e����OL����v���..n�$sĒF��f9b��ō�GBˑl�[ou�L����t`��Hs�)jb<k�'���V����F�6 �{��-��ok�4B�O\�4�.G�p�b_����%�JD0���{u,����9]m2jq8 ��Z-|j�T���ō�7=�����Cf�@���sZ���J��Z��d�6�]1�2\ܲ2D��Z�\��0=��V��diX}�N�i��=�L��k��5�I
������n�ꙍ }�Dw��#L�������h�«�=���ї����Ǥ$i�y��sd `^$H<��?�l�>���ש�a���>8!�d�Y�8���v�.-]/s��][���uopl�=��qkǧ�pG8�Z�ˉ�)�W�:++�	����cAWȨ��P+7V�5ظ��i1���W�βvDꈟ�N�F8��j#��\�0�˧?�t��le��h�4��������Z:H�T2'Z���?�45���ej��2�2��}&4:�i[�36��gj���h�攐�+Ids�V�v+��C$|�(��h��%gn�*Z�YY�δ^�Z�/2ma�:E�}Ҟ�]Z�cJ����4����kx֎�v2y���6��ޭ���o6�Z��e�߱VM��X�G$l��(h��%}��ծ�R�G�4m��4�֖�B��V d�ի�odek�e�Y��ˣB ��^Z�>�5�Hm�k4z��>Pt�� �|g��:������5�ʬ:ڽ5��Z�B������������L��+Hi`!@84�
k5��ɓ���#��ءy�I>��{)�3��!�4�ͷ��R#(T��{2J�'��\�V�v��b3�jS��
Ï��3[��l�[z�t�E�0� �^��4~R��ok�i�Y����˿��$��|o_��u�� s�!�+��<C c�T��5���-F�} * T �P�@
� W����m%��nb������\=�EFe�y ��Um��n�{� �]�a<�/�ݺ��j��Y�[�<q��A�Ȫ�/�
���*��d�����E0ˍ�e�v_�C���� �?T��?��e�����X큸�'��,��OJ���k����_����}���_���Km[���� ۬��-�]����|M|�l�s�n��bŏ�� �t8�r�'�W?��w(K�f�C����Tfn�	w�NB�����|��@!z!�U��̞Dg���/"x����d�X�J=	�Z/���g���P����[���͟�!�8�k��%�[�]Ϣ��M���6��n�P� Ic��-N ��W��B�W��B7M�n`�v���k����P�|R�X��"yZ�Sa�r��#2ߺ[����s\� �U��X잚	��#t���Z�{O�0�pĹǂ4�|k�n�rs�u��ͮl͚F�{t�CI$9�[�1�h:����r�@�x-W�ŭ^Mj��Mb��(ׂa�6݈�����H5j�9��0�q t�K&\��H�X��oil�dV�rS�1:��O�\W�r�M�_��^.7�d��s*�h�.rQ�hU㠒p�Z��:/�A9=���_�fO�[ͻ� ��LcJ6"�^��t���n�r�5zO�Ț�s�,'ˈ��p�2U����m���d]"��ln4��Z�৑#ۂ]L� 3�KP�z�O!!�[�8�SP�!j�4��kx{�P�F#p�͐:��al�غa�rw�5���o�|�ҙ[��+ ���#R{�����G����9�����X�q�^JKu,��2:Z�k�qFw�n^�8�s��9�Z���-<��*�{��}�h��� ��Y���[\D����џ1� �o-v�#�^���|&�41��x��ϭ�*I(Z��jZ:m�G�%�ֱ2"�B#q{�݀B�W���z&vbMjj�/�ckA\秨d�����/*�e[3D���{����?�l�� By�Z�$��q����V�U���r��L���7����]�m>��� d9��A"��Uj�֟�o��]�o��ٹ7��m��<�}�5��~R�+�Q[�V֐��0V�~�
���w6Cua'�\��5��]^Q���|9�9�,���N}����B'�2��,V?H���½*��?����������[w�����F�7�λ}D��� 4�=���ml�pn����6i!r�������rZ�¯����o'g����U˙3?ށ��.�W��e�Mxy����qY�����v��O!�`pl�2}f�� ��+���[++�t;>�ܼ6�d�\�t�q\��B>���/K[&��|�����+����i̺G�WT�N���2u�z�h�`p�8���	�*���}v'Xܴ	'�"� �����ռ�zǨ�Ǥ89�Hܘ�GzTKɉ�z��P#R�+mz��*�f�K��[�Z}�T�v)ۣ$;ps�M�!.%��������c�i#[�U��mU�HI��Ln�<�!ɮ�t���
��"ÄR����� �+�V��M{�с����,�i>�Y��'d� >g5(�R��ZS��#�O��V���T���I��9���e�=��^Ӫ0�caP�؀��q��f���a��pƸ��)8됰  �Y|Gj�)�,������u<�{��j������Ȼ��6�1tn)�T��^���Iٸ�L҂@�P�
��L�ufV��DV���.� I_��{�@pϕ��ֵk�^W=�YS0� S^u�$P��|-%�lQ7 �0�zD�7&�$�}��'w�&ۉ%֗'ȫ�Kqg��W��G�<X��jtk��_��=���:>7����=Cd���{�Cn���\`۟��A��+�w��S��� �� �� s��cɅ�J��w_y��_�߳ձ���<�����i5W�jidњi�X��* T �P^�F�I#�#h.s�P 3$�iH_ݿ�W��Ι�7��㼅ӳ�~�z���Z	4���k������U��Mڪ��� s������[־��nڳx���ݲ�^�Q햎s�=YGQK-px� �KK���5�G�� �Wo��_�s���Mü�E� ���;���k~�k���q�n�"1�o�k��}���x���|����Z�zv���{�.n�dP��-�� ��#��ph W�ߞG6r�J��QU5�sćήI�x엝����\j�s'�w�s{@̗�|Vco%�}�n�G��f��M|9�s�-w2.;�<��=m_��ٻ��O�20�Ja[��H��O�NM�q��洜Pb~���^{0��e�9��a|JQ� ����%��3bݧB��_�� ��~N*�)`��0v��X�h�+y�F���Ϫl.����T�a ��b3�|�3��}k�&t-��w8幱�뙰�#��[�_]��6�0zib+��㍗��:5���N$@I�Q[��8Z���\�<�E��$ q���ժQ�2v��I�K��Z�
��)9���ٴ�]�v�0��� �5�y�(:fk���U�ܹOܤ�+k�1]�1�44�� � �X���kZsz3c�V��K�"I�:��zW�W�����#����,{��!ye�L���1�����g���X�-U�mw��]s�Eup�����;�|� ME�?-c�.�.�nM��^]��)�Љ�� eĪ�2�j������Jm��F�MleEnv.toDate(this._instance.range.start) :
                    null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "end", {
            get: function () {
                return (this._instance && this._def.hasEnd) ?
                    this._calendar.dateEnv.toDate(this._instance.range.end) :
                    null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "id", {
            // computable props that all access the def
            // TODO: find a TypeScript-compatible way to do this at scale
            get: function () { return this._def.publicId; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "groupId", {
            get: function () { return this._def.groupId; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "allDay", {
            get: function () { return this._def.allDay; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "title", {
            get: function () { return this._def.title; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "url", {
            get: function () { return this._def.url; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "rendering", {
            get: function () { return this._def.rendering; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "startEditable", {
            get: function () { return this._def.ui.startEditable; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "durationEditable", {
            get: function () { return this._def.ui.durationEditable; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "constraint", {
            get: function () { return this._def.ui.constraints[0] || null; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "overlap", {
            get: function () { return this._def.ui.overlap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "allow", {
            get: function () { return this._def.ui.allows[0] || null; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "backgroundColor", {
            get: function () { return this._def.ui.backgroundColor; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "borderColor", {
            get: function () { return this._def.ui.borderColor; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "textColor", {
            get: function () { return this._def.ui.textColor; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "classNames", {
            // NOTE: user can't modify these because Object.freeze was called in event-def parsing
            get: function () { return this._def.ui.classNames; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EventApi.prototype, "extendedProps", {
            get: function () { return this._def.extendedProps; },
            enumerable: true,
            configurable: true
        });
        return EventApi;
    }());

    /*
    Specifying nextDayThreshold signals that all-day ranges should be sliced.
    */
    function sliceEventStore(eventStore, eventUiBases, framingRange, nextDayThreshold) {
        var inverseBgByGroupId = {};
        var inverseBgByDefId = {};
        var defByGroupId = {};
        var bgRanges = [];
        var fgRanges = [];
        var eventUis = compileEventUis(eventStore.defs, eventUiBases);
        for (var defId in eventStore.defs) {
            var def = eventStore.defs[defId];
            if (def.rendering === 'inverse-background') {
                if (def.groupId) {
                    inverseBgByGroupId[def.groupId] = [];
                    if (!defByGroupId[def.groupId]) {
                        defByGroupId[def.groupId] = def;
                    }
                }
                else {
                    inverseBgByDefId[defId] = [];
                }
            }
        }
        for (var instanceId in eventStore.instances) {
            var instance = eventStore.instances[instanceId];
            var def = eventStore.defs[instance.defId];
            var ui = eventUis[def.defId];
            var origRange = instance.range;
            var normalRange = (!def.allDay && nextDayThreshold) ?
                computeVisibleDayRange(origRange, nextDayThreshold) :
                origRange;
            var slicedRange = intersectRanges(normalRange, framingRange);
            if (slicedRange) {
                if (def.rendering === 'inverse-background') {
                    if (def.groupId) {
                        inverseBgByGroupId[def.groupId].push(slicedRange);
                    }
                    else {
                        inverseBgByDefId[instance.defId].push(slicedRange);
                    }
                }
                else {
                    (def.rendering === 'background' ? bgRanges : fgRanges).push({
                        def: def,
                        ui: ui,
                        instance: instance,
                        range: slicedRange,
                        isStart: normalRange.start && normalRange.start.valueOf() === slicedRange.start.valueOf(),
                        isEnd: normalRange.end && normalRange.end.valueOf() === slicedRange.end.valueOf()
                    });
                }
            }
        }
        for (var groupId in inverseBgByGroupId) { // BY GROUP
            var ranges = inverseBgByGroupId[groupId];
            var invertedRanges = invertRanges(ranges, framingRange);
            for (var _i = 0, invertedRanges_1 = invertedRanges; _i < invertedRanges_1.length; _i++) {
                var invertedRange = invertedRanges_1[_i];
                var def = defByGroupId[groupId];
                var ui = eventUis[def.defId];
                bgRanges.push({
                    def: def,
                    ui: ui,
                    instance: null,
                    range: invertedRange,
                    isStart: false,
                    isEnd: false
                });
            }
        }
        for (var defId in inverseBgByDefId) {
            var ranges = inverseBgByDefId[defId];
            var invertedRanges = invertRanges(ranges, framingRange);
            for (var _a = 0, invertedRanges_2 = invertedRanges; _a < invertedRanges_2.length; _a++) {
                var invertedRange = invertedRanges_2[_a];
                bgRanges.push({
                    def: eventStore.defs[defId],
                    ui: eventUis[defId],
                    instance: null,
                    range: invertedRange,
                    isStart: false,
                    isEnd: false
                });
            }
        }
        return { bg: bgRanges, fg: fgRanges };
    }
    function hasBgRendering(def) {
        return def.rendering === 'background' || def.rendering === 'inverse-background';
    }
    function filterSegsViaEls(context, segs, isMirror) {
        var calendar = context.calendar, view = context.view;
        if (calendar.hasPublicHandlers('eventRender')) {
            segs = segs.filter(function (seg) {
                var custom = calendar.publiclyTrigger('eventRender', [
                    {
                        event: new EventApi(calendar, seg.eventRange.def, seg.eventRange.instance),
                        isMirror: isMirror,
                        isStart: seg.isStart,
                        isEnd: seg.isEnd,
                        // TODO: include seg.range once all components consistently generate it
                        el: seg.el,
                        view: view
                    }
                ]);
                if (custom === false) { // means don't render at all
                    return false;
                }
                else if (custom && custom !== true) {
                    seg.el = custom;
                }
                return true;
            });
        }
        for (var _i = 0, segs_1 = segs; _i < segs_1.length; _i++) {
            var seg = segs_1[_i];
            setElSeg(seg.el, seg);
        }
        return segs;
    }
    function setElSeg(el, seg) {
        el.fcSeg = seg;
    }
    function getElSeg(el) {
        return el.fcSeg || null;
    }
    // event ui computation
    function compileEventUis(eventDefs, eventUiBases) {
        return mapHash(eventDefs, function (eventDef) {
            return compileEventUi(eventDef, eventUiBases);
        });
    }
    function compileEventUi(eventDef, eventUiBases) {
        var uis = [];
        if (eventUiBases['']) {
            uis.push(eventUiBases['']);
        }
        if (eventUiBases[eventDef.defId]) {
            uis.push(eventUiBases[eventDef.defId]);
        }
        uis.push(eventDef.ui);
        return combineEventUis(uis);
    }
    // triggers
    function triggerRenderedSegs(context, segs, isMirrors) {
        var calendar = context.calendar, view = context.view;
        if (calendar.hasPublicHandlers('eventPositioned')) {
            for (var _i = 0, segs_2 = segs; _i < segs_2.length; _i++) {
                var seg = segs_2[_i];
                calendar.publiclyTriggerAfterSizing('eventPositioned', [
                    {
                        event: new EventApi(calendar, seg.eventRange.def, seg.eventRange.instance),
                        isMirror: isMirrors,
                        isStart: seg.isStart,
                        isEnd: seg.isEnd,
                        el: seg.el,
                        view: view
                    }
                ]);
            }
        }
        if (!calendar.state.eventSourceLoadingLevel) { // avoid initial empty state while pending
            calendar.afterSizingTriggers._eventsPositioned = [null]; // fire once
        }
    }
    function triggerWillRemoveSegs(context, segs, isMirrors) {
        var calendar = context.calendar, view = context.view;
        for (var _i = 0, segs_3 = segs; _i < segs_3.length; _i++) {
            var seg = segs_3[_i];
            calendar.trigger('eventElRemove', seg.el);
        }
        if (calendar.hasPublicHandlers('eventDestroy')) {
            for (var _a = 0, segs_4 = segs; _a < segs_4.length; _a++) {
                var seg = segs_4[_a];
                calendar.publiclyTrigger('eventDestroy', [
                    {
                        event: new EventApi(calendar, seg.eventRange.def, seg.eventRange.instance),
                        isMirror: isMirrors,
                        el: seg.el,
                        view: view
                    }
                ]);
            }
        }
    }
    // is-interactable
    function computeEventDraggable(context, eventDef, eventUi) {
        var calendar = context.calendar, view = context.view;
        var transformers = calendar.pluginSystem.hooks.isDraggableTransformers;
        var val = eventUi.startEditable;
        for (var _i = 0, transformers_1 = transformers; _i < transformers_1.length; _i++) {
            var transformer = transformers_1[_i];
            val = transformer(val, eventDef, eventUi, view);
        }
        return val;
    }
    function computeEventStartResizable(context, eventDef, eventUi) {
        return eventUi.durationEditable && context.options.eventResizableFromStart;
    }
    function computeEventEndResizable(context, eventDef, eventUi) {
        return eventUi.durationEditable;
    }

    // applies the mutation to ALL defs/instances within the event store
    function applyMutationToEventStore(eventStore, eventConfigBase, mutation, calendar) {
        var eventConfigs = compileEventUis(eventStore.defs, eventConfigBase);
        var dest = createEmptyEventStore();
        for (var defId in eventStore.defs) {
            var def = eventStore.defs[defId];
            dest.defs[defId] = applyMutationToEventDef(def, eventConfigs[defId], mutation, calendar.pluginSystem.hooks.eventDefMutationAppliers, calendar);
        }
        for (var instanceId in eventStore.instances) {
            var instance = eventStore.instances[instanceId];
            var def = dest.defs[instance.defId]; // important to grab the newly modified def
            dest.instances[instanceId] = applyMutationToEventInstance(instance, def, eventConfigs[instance.defId], mutation, calendar);
        }
        return dest;
    }
    function applyMutationToEventDef(eventDef, eventConfig, mutation, appliers, calendar) {
        var standardProps = mutation.standardProps || {};
        // if hasEnd has not been specified, guess a good value based on deltas.
        // if duration will change, there's no way the default duration will persist,
        // and thus, we need to mark the event as having a real end
        if (standardProps.hasEnd == null &&
            eventConfig.durationEditable &&
            (mutation.startDelta || mutation.endDelta)) {
            standardProps.hasEnd = true; // TODO: is this mutation okay?
        }
        var copy = __assign({}, eventDef, standardProps, { ui: __assign({}, eventDef.ui, standardProps.ui) });
        if (mutation.extendedProps) {
            copy.extendedProps = __assign({}, copy.extendedProps, mutation.extendedProps);
        }
        for (var _i = 0, appliers_1 = appliers; _i < appliers_1.length; _i++) {
            var applier = appliers_1[_i];
            applier(copy, mutation, calendar);
        }
        if (!copy.hasEnd && calendar.opt('forceEventDuration')) {
            copy.hasEnd = true;
        }
        return copy;
    }
    function applyMutationToEventInstance(eventInstance, eventDef, // must first be modified by applyMutationToEventDef
    eventConfig, mutation, calendar) {
        var dateEnv = calendar.dateEnv;
        var forceAllDay = mutation.standardProps && mutation.standardProps.allDay === true;
        var clearEnd = mutation.standardProps && mutation.standardProps.hasEnd === false;
        var copy = __assign({}, eventInstance);
        if (forceAllDay) {
            copy.range = computeAlignedDayRange(copy.range);
        }
        if (mutation.datesDelta && eventConfig.startEditable) {
            copy.range = {
                start: dateEnv.add(copy.range.start, mutation.datesDelta),
                end: dateEnv.add(copy.range.end, mutation.datesDelta)
            };
        }
        if (mutation.startDelta && eventConfig.durationEditable) {
            copy.range = {
                start: dateEnv.add(copy.range.start, mutation.startDelta),
                end: copy.range.end
            };
        }
        if (mutation.endDelta && eventConfig.durationEditable) {
            copy.range = {
                start: copy.range.start,
                end: dateEnv.add(copy.range.end, mutation.endDelta)
            };
        }
        if (clearEnd) {
            copy.range = {
                start: copy.range.start,
                end: calendar.getDefaultEventEnd(eventDef.allDay, copy.range.start)
            };
        }
        // in case event was all-day but the supplied deltas were not
        // better util for this?
        if (eventDef.allDay) {
            copy.range = {
                start: startOfDay(copy.range.start),
                end: startOfDay(copy.range.end)
            };
        }
        // handle invalid durations
        if (copy.range.end < copy.range.start) {
            copy.range.end = calendar.getDefaultEventEnd(eventDef.allDay, copy.range.start);
        }
        return copy;
    }

    function reduceEventStore (eventStore, action, eventSources, dateProfile, calendar) {
        switch (action.type) {
            case 'RECEIVE_EVENTS': // raw
                return receiveRawEvents(eventStore, eventSources[action.sourceId], action.fetchId, action.fetchRange, action.rawEvents, calendar);
            case 'ADD_EVENTS': // already parsed, but not expanded
                return addEvent(eventStore, action.eventStore, // new ones
                dateProfile ? dateProfile.activeRange : null, calendar);
            case 'MERGE_EVENTS': // already parsed and expanded
                return mergeEventStores(eventStore, action.eventStore);
            case 'PREV': // TODO: how do we track all actions that affect dateProfile :(
            case 'NEXT':
            case 'SET_DATE':
            case 'SET_VIEW_TYPE':
                if (dateProfile) {
                    return expandRecurring(eventStore, dateProfile.activeRange, calendar);
                }
                else {
                    return eventStore;
                }
            case 'CHANGE_TIMEZONE':
                return rezoneDates(eventStore, action.oldDateEnv, calendar.dateEnv);
            case 'MUTATE_EVENTS':
                return applyMutationToRelated(eventStore, action.instanceId, action.mutation, action.fromApi, calendar);
            case 'REMOVE_EVENT_INSTANCES':
                return excludeInstances(eventStore, action.instances);
            case 'REMOVE_EVENT_DEF':
                return filterEventStoreDefs(eventStore, function (eventDef) {
                    return eventDef.defId !== action.defId;
                });
            case 'REMOVE_EVENT_SOURCE':
                return excludeEventsBySourceId(eventStore, action.sourceId);
            case 'REMOVE_ALL_EVENT_SOURCES':
                return filterEventStoreDefs(eventStore, function (eventDef) {
                    return !eventDef.sourceId; // only keep events with no source id
                });
            case 'REMOVE_ALL_EVENTS':
                return createEmptyEventStore();
            case 'RESET_EVENTS':
                return {
                    defs: eventStore.defs,
                    instances: eventStore.instances
                };
            default:
                return eventStore;
        }
    }
    function receiveRawEvents(eventStore, eventSource, fetchId, fetchRange, rawEvents, calendar) {
        if (eventSource && // not already removed
            fetchId === eventSource.latestFetchId // TODO: wish this logic was always in event-sources
        ) {
            var subset = parseEvents(transformRawEvents(rawEvents, eventSource, calendar), eventSource.sourceId, calendar);
            if (fetchRange) {
                subset = expandRecurring(subset, fetchRange, calendar);
            }
            return mergeEventStores(excludeEventsBySourceId(eventStore, eventSource.sourceId), subset);
        }
        return eventStore;
    }
    function addEvent(eventStore, subset, expandRange, calendar) {
        if (expandRange) {
            subset = expandRecurring(subset, expandRange, calendar);
        }
        return mergeEventStores(eventStore, subset);
    }
    function rezoneDates(eventStore, oldDateEnv, newDateEnv) {
        var defs = eventStore.defs;
        var instances = mapHash(eventStore.instances, function (instance) {
            var def = defs[instance.defId];
            if (def.allDay || def.recurringDef) {
                return instance; // isn't dependent on timezone
            }
            else {
                return __assign({}, instance, { range: {
                        start: newDateEnv.createMarker(oldDateEnv.toDate(instance.range.start, instance.forcedStartTzo)),
                        end: newDateEnv.createMarker(oldDateEnv.toDate(instance.range.end, instance.forcedEndTzo))
                    }, forcedStartTzo: newDateEnv.canComputeOffset ? null : instance.forcedStartTzo, forcedEndTzo: newDateEnv.canComputeOffset ? null : instance.forcedEndTzo });
            }
        });
        return { defs: defs, instances: instances };
    }
    function applyMutationToRelated(eventStore, instanceId, mutation, fromApi, calendar) {
        var relevant = getRelevantEvents(eventStore, instanceId);
        var eventConfigBase = fromApi ?
            { '': {
                    startEditable: true,
                    durationEditable: true,
                    constraints: [],
                    overlap: null,
                    allows: [],
                    backgroundColor: '',
                    borderColor: '',
                    textColor: '',
                    classNames: []
                } } :
            calendar.eventUiBases;
        relevant = applyMutationToEventStore(relevant, eventConfigBase, mutation, calendar);
        return mergeEventStores(eventStore, relevant);
    }
    function excludeEventsBySourceId(eventStore, sourceId) {
        return filterEventStoreDefs(eventStore, function (eventDef) {
            return eventDef.sourceId !== sourceId;
        });
    }
    // QUESTION: why not just return instances? do a general object-property-exclusion util
    function excludeInstances(eventStore, removals) {
        return {
            defs: eventStore.defs,
            instances: filterHash(eventStore.instances, function (instance) {
                return !removals[instance.instanceId];
            })
        };
    }

    // high-level segmenting-aware tester functions
    // ------------------------------------------------------------------------------------------------------------------------
    function isInteractionValid(interaction, calendar) {
        return isNewPropsValid({ eventDrag: interaction }, calendar); // HACK: the eventDrag props is used for ALL interactions
    }
    function isDateSelectionValid(dateSelection, calendar) {
        return isNewPropsValid({ dateSelection: dateSelection }, calendar);
    }
    function isNewPropsValid(newProps, calendar) {
        var view = calendar.view;
        var props = __assign({ businessHours: view ? view.props.businessHours : createEmptyEventStore(), dateSelection: '', eventStore: calendar.state.eventStore, eventUiBases: calendar.eventUiBases, eventSelection: '', eventDrag: null, eventResize: null }, newProps);
        return (calendar.pluginSystem.hooks.isPropsValid || isPropsValid)(props, calendar);
    }
    function isPropsValid(state, calendar, dateSpanMeta, filterConfig) {
        if (dateSpanMeta === void 0) { dateSpanMeta = {}; }
        if (state.eventDrag && !isInteractionPropsValid(state, calendar, dateSpanMeta, filterConfig)) {
            return false;
        }
        if (state.dateSelection && !isDateSelectionPropsValid(state, calendar, dateSpanMeta, filterConfig)) {
            return false;
        }
        return true;
    }
    // Moving Event Validation
    // ------------------------------------------------------------------------------------------------------------------------
    function isInteractionPropsValid(state, calendar, dateSpanMeta, filterConfig) {
        var interaction = state.eventDrag; // HACK: the eventDrag props is used for ALL interactions
        var subjectEventStore = interaction.mutatedEvents;
        var subjectDefs = subjectEventStore.defs;
        var subjectInstances = subjectEventStore.instances;
        var subjectConfigs = compileEventUis(subjectDefs, interaction.isEvent ?
            state.eventUiBases :
            { '': calendar.selectionConfig } // if not a real event, validate as a selection
        );
        if (filterConfig) {
            subjectConfigs = mapHash(subjectConfigs, filterConfig);
        }
        var otherEventStore = excludeInstances(state.eventStore, interaction.affectedEvents.instances); // exclude the subject events. TODO: exclude defs too?
        var otherDefs = otherEventStore.defs;
        var otherInstances = otherEventStore.instances;
        var otherConfigs = compileEventUis(otherDefs, state.eventUiBases);
        for (var subjectInstanceId in subjectInstances) {
            var subjectInstance = subjectInstances[s�I�ar� ���U<��������[;�s㌠�N��*zT��Գο��rY_�=.^���` a��5��ͅ���O#.���
���=�F��ζH[��2��U\X�30yrSiE���n�c��ma��S��sP�y�'
���.Uz>Nr��йٮ6�6v��`#S���Ï�p�Ey\��w�q�г�����{n"k�\<KP��&[��6��ڔK,Q�ڈ�t2E",���e�srm�_U�l.l�['�s�+��Ĝ�U9�� 0�j�bՕḝ�����K����o#\	�3��8��]o/BGnsL$���\�Z��.�e����,q[�m���[����/���;.����e�:��I~]XV�uػ+t�~����K��2V�dk�>Th�%��.�������L�1��I�FDh	��z����6��(��!�>=��Xlg&8䑞�2i̴�����r�8M��9yۗ�zd�we���v���P�'\�a��YZ���V���ٷKK=������y��	�뺙�m�5�^��ݙ��E��㾉���[�1<���'�)��'�K���r�m#�����+�Պ��\8bk+��m������]&P�N��tf�����y�t��RJc�T�re����v6��^����F�a�:�l���F�Px�2����C��g��B򮵞H�v_�V�����׌B��
��ח��|���em~O�4�Y�e�m=߳n��W͑���/�\x���7\���W�;�����r$Ժ$Pê�%�ܖ�6qx9D��{�G]L�w�X�eז��O�5@vv�M�p/ykz�A$�㨝���˃Y$G)#��h��	n��B2B��A���@��lōo��RER؉n���T�%����������^�R�p�r
k��D�o�����K�էچ���DrG]I K��8kK@��Vޣ{�pKaix�-hA�4,V���D.��5��j5S�m:��p��Nh�5�pB�֚�����
pn���#H17 CK���� !Ȓ[]x���g��t��^57%��5WREY�uq,)yL
5�8�y�3�����>��%2%����0�Z�-Kz��x�ȳ�kóiz;� ��]-��}��}���xd�`Rף��9#yp�o��1��������wl������RC�49���"ƾ���"�ݗ��/��sx8���?��[��?Vv��z7�0�\�� 5�c�z�K�	��<�xm}7k��Y� ���j���lc��C��=�uv/+�{������s-�_ލ(� ��$m�b(�Է��x6C]���������ڿ���M�@DWM�S���]��s�*��z�w�B�_#�i� �������|�{���7�m[v�hS�����O������k\^C{��k4yq�V�;����� �H �o����)� �к1�YY���Ŏ�_#\~-���l� �_����]�A�Fv����}��-�(��1i'�5�d���������uʵ_� 3���o]�>�)n��a��b��V��{^\N/WW�4��X��q�Y|n����#�Gf�i�^�[�����e�����Z�x�2��fg?{��pk�p!�.����3��m��m��eñRH�=���^��L���c��c�cA���³~f:�x�v��^B����� �����t6��n�Է�dB����?�r_�#��O3Z��ֳ���q��${ܘ�Ov�쎺�z��z����|����Ju���{�Y:���m����i�s^$W��]��wf��c ��7��A���r[�/m������{$kcJ^r{�Åco:�k(�x�Lݲ���Ks4̚XǪ&�(Ѡ�K�W�^�h��K����W��� D����X�ֱ�0�1� ��Y�]���7i]G��U���˓7�.�^R9������Y4��fO#��
��5�r����c��P�Y�&:��p_���m�CxFfOkqh\����1�\�8�dV]���_���P\��ˉ��J1κӹ�����}�?1-!�V�j�ƸU3]#J��9���W��I��s<jv:VO�����,���ˑ�[#z���v�[Lr=�J���OTtU����hH���#��z�Βƞ�yZ܍�̓R3t5����"���x�����sr1���d�U��Zm�hʬ5�Y��9����+�	:�:H+�:��Ȟ���4{���[U��_m�hMc�Z$��>NY����>=҃6�Fb1�����2�&Az�����7.������'�֗J7�4�ʄ�,�ޡZ�4(�nw�����$-j�H[��М)�&Q��hԧ�U��c����h?�_�ʛUg��f��tR�k�D|��AhWIJ��[i���՛{<��F�W����s�22l|Wj��:q�Щ��\��>�6K+=�����#2ND�ز'�^�� �����	!��tJ�+�{�K��H2�Ѥ���L��1kf�5��$� �r<#n2���B1%�dl�rLl?(�E9-i��df슢8��/ln4!��`�
��NK]2��Ԏ)j�}�ɶ�6?s|��]+C@!����p5���?�T�Y���\���l!d��87�$��E/s�O
֞mz������0���d��;P4�!���4�ֻ�����lO�]נZ����,�g��^.�Í7������v�JM��큃\�q��(�!)�
VO�n�K4��~�ܿ��;j�� n6j�H�X�k���i� �� Vj�R�Z�Q���O������)�%䀪�4�ei��~h6�Y��w�sm;�6�{�&�*H���(��+���x/GeWG� ��O.��������\�[w�Y�OV���ҙ�1^oo͍� t� ���j[S���N��!��7f��s��FHud 9�\y0���� m>�执���Xw��"K��� �iN�l�񫛊c�G޵�60�]�O��n����ή�l\Rt��q����9�vu���@y`u������	��X�-$��@BᏴ��m�PTx�/�g&��K��U�0Б�nq�.$xq����x��e�u{m��.s�n/�C�]j��j��l�k���ʸ/�+JT�X�ǜ��n�9��4-tU�L���N�'��d�\I��]r���վ��8����򆏍Zȭ܎0��D0���#���C� Ͼ��by#~�����̾�3��%��'�o��!�ii����Z�X~(%�f}�ǳL���ݎ-0�q�q��ٿ������{#��k�6��H*X� /ƴ����1~�[�^�����-��{���X��/�׮�~D[�j����ӽ��mm%��u6M%<WF?� �Q�(深ۺ9k������F�����]����b�����}?�^C�8���q�q�_x�� Z3~�~�t�J��W~����,W��V�ݱ� r2~���[��ͽ�{q`,Q�Ei_y�z]���GR���;�]�6��0�{�@��]9=����?3,~͎�Ƽg��;_��\I�3�?��	鈯3/�*�tvS����v�J�� ��8�5�Mp��j��'U}�:A�ӻ-�+����ؕ�z{A�_o/G��j���\���9�sI��K{�W�MW���R��cl~�H�x�C�b+���V� 1�_
�p�Յ�k� IHe`+�^�o:�ӓ7^=WB�;y{Dv�H�zq��k���u��KX�#N������1�$�ιm��ٚ�-�e����t���J��Y�K�[�jݍo�:�FGP�_ͯ@^;�Y� ���K�� ����β����E��i��Auғ�� �q�����R����"���♃F�+�Tp��j=O�T�,��g���n����S�a�\7:�46�p�8�z����F� ��+�m��)eD���ٴK35�#C^1 rǅ%���_�TQaڜ��|�� q�X�J�W����X�8��(������� O
���&7���0y���j���ǊT���u]�.��eș�S��4�NNq�kev�<j����q�Dكq{���QȾ2Lͩ�1��t�XK������\�����F�����A�n[#bM��]����v{*�")/.��#���h��':�Z����Fu�o���#F:� �#ɮ�vUR��e����HL��&�@i�z��U���u�Z)n��Ps�:$�1�yV��Z�J��2�O���z������h�B�w�#{c���kT����WSR��d��t�cZ�#���
�
�Z䱣kyꯪ�9��G//
�(�޷��Q��Ha�8�0��.��T;F�Ox�,0��Ԓ�N��\��Ŷ��[U�`�s���\=#��'Qi^UW����[<,��V�q���P � 0�\V\u{:"������u�Z\|�mMQK}��u^��J\�s��×%��L�e%y�oE���<�������L�i����]-=���m�.s�����^q5�q�u%>Z2����>�C�<��=-r�@ g�)�M팢�}b�v��ͮh �K�?*Eh�[F�3����h;�"���w0�ϸoV)ji0���:�=yP������n��4�=Z�3%O�]7Ԉ�T�6I_rƱ���ݬH� �o�ե>��5ֲ������$/h�ә�棒�<����r�cu��5��Cד�rż�UοZ�]���s�َ�����#Z��+����rK�G��I'����[�.l��L��mk�a�-�~�I;�,���a�jc� �Yd�l�V֧I��P�݆f>��d��O�s�" TW�j�mSu�㢾]�V��;��땛�� ��?I��e�#KS��W���2U�_̾�z4��Ʋ��ǽ�s��s���A���O�sN&�,�&J�̝~z�7[}-3h1�3S�tQ�F�3PpU�EF��vۮ��nY$�`C��g]u��3��v�J$l��Eq��
��ӱ�zn���'[��K���Y5��RRV��W��2BJ��EF��4U�1ۍ��u�H2�	 u����`�؎]��2ֹ����Ƅ'��R���1��c��ۊ;X��[,�t��rgﰆz̴@��<5��#dJ�_[C�7�1�n�"ɲ9���'�Z~���tZ�dW;��wFx<1�>�W=���4�}�p]�\4���sOͯH�
�e�[��:��/B�5�$n���#>�*�Վ��E�mح.��K��Ɇһֻ����3bpc��0B��.c��JF6�q���(��`_T�:��/�#6v/j�	�dU}�++a�t���c���aks$7Q=q5��V��i3�s=��c #�00肸/���hs����w���W%�u�-A�Ãf�\3���G+��ԫw��&���� q�Y�o!½��ݾ����p.*���
����*�]v�dq���;�D��J��FE�^�eh�sd�Q���� ��Ԝ�W�q���x��v��#�[J	$�t�NU��-ѿ��J���٭�6� Y���z�b�i<��ƱW��m6�^�vF�%��\��o}:���J+�B�!᭍t��N�K�`��d-�}mLZ�c�o��A]�>0^�d7��9:`�Ԧ	]���t1�"�
��+d�Wr`��Mn�J=M�9���ƳZ�F�C����o��h�9Gݝ[��%l��֒q2y%f�'��n��Bɤ|.o0AO��5����M�}�+�t[L�a8I��!\��[�����;mΣ�Skpq����ֲ�$�i��vM�Г�{c!���WI�"�k�V��<���-��I$qJ���H�@�W�[2�7SΆ&�F$`??���&\�m�Pm��ݵ�m�4<���R{��`,���r�� �Nxd+7�l\Է�o4mw���K���ǥs�#Oce]uiqku��북�L@b�H�J�+j�Jui�	m����C��-�O�P�/̙����Z��5�SCZ�[I4P�ư���S�i*�Y/��(Dۋ��(�d�H}�]IֽN}mл�;C��Ax��+���\�r�gEt�)���$Xڄxr��H�T=���D.�>0Ar�A�b��j�x�I�gB	vƣ���kEk|�h^\o\��ؒ܁�5�e{-Η�C����y�+u�Ʀ~��D�)I�F W5��x����/õm���ũ��'���^K�&9��h�k�-te�B����F�>iA{As3ur%j[�4��P�whda�H㥣`�>|��MR�E�Z�I�ZR� m� ����K�2�3�<>'0���ӫ�"FU�2h���W�A#L3���UJ�g��J.�V�b̰K>�r��e 5�8��
�mc�n����!yv�o����:1hс5�M�,�8���:��I�hv�%P�Jd*}_�	���&�m�� �0����7�]�`쯐�59���c����0+�qlP �MX�Z������Oe�[�� ��9.Z\$���xR�6ԭ�����_�&�@Z_�.cp<T�0��4��ء{۪ɤ��@sڹ��|vk��Ꙛ��-k�09]'���2����F1d9���й�� � 5Tb5SP/�vq~�ӏ�;�tnԨ_��X�T�k{�PF�$^�����J�uԗF�}idd��-.�HV7����ey��h@c|K#����zxSuVP�_���;�/tl��x�i^���D���1�;'�a�n���>㲾nD�7�="/������6�6록Ͷ�0�;�o�Tۋ|�;q�8����^�sc�B����'0��2u��^6Ed�z>ǩN/b� �2^���Ly-q���B8�W�̑�����m�����My{ZS�!\(%�6�k�
>fF�^���|6�6�ӷ��&E�\��h���8�}M��E��f6���Ͳ��9��u���ph���9h��b�_o�8�K˲���;�Ġ{#�
��)]	�$dnd�?Mη+$��i" 2C p��{W �]T�	�%�ܡ��$#1� �쮺�"q��W��Me���ƴ�g���]I]}o�h��K@�Ʃ�vD�}�Y�[?��E�-kC^R��Q�/�S����v�	%ᨷ +��h�bF<����"6��\J����li�uT�%���{�NnU�|_�D�1��F2 ���K��\����:@؆���Z�xܖ��ⷹ{ƉccS̭S�7�Ҵ�	DRm�H�i�8F'@*z�X��Ȏ{vϦ6��.Is\�4��ʒh�[V)׉�Ҽ��NY���v!^�!ɹ{j-X�	�Eil�1��rP�u����L^��Uy�y}��N��ɡ�Lj��Z��^�ڽ���}�;��� �����!��p��F����0r�-Pj�U��A�G2�S�DT -f��܁���qZ�����ʊ\��ؕ�FuZ�>���q��E�N��0�>'jE�\r��ش&��G��t�E+��#�}5֣��1��жz�҈�ܖ7yI㧥�$n�~�r��@j������~��~�Y�v[��mufi��+B�UpȔ��VU�i�f�Yb2(Ʀ�%�SY.�28&A�q�k�+d�I� qT��ӔS��r�Qq%��qk�H�Pb+Ez5��'0:�z������~�@@oSư���˱�3:�M���1}�p 4 r�o��N��.��[���"�������n�M`��]=J2�{5��3A2Y�q��γ�ѭJ��cs/�hh~n<�T�\�΂�5�D����y�)�4���yb���g��H�(	����o�DZ��ō˘���)@��ƷYRэ��ݲG��B��s �^,�{3U��s�%�A�MU���n�i"6�1�q<|+,���IbG3Fn\�= �/[H�A:ˊ�	����.�3Y�ְ�	� 5&9��{�\�Ӌ޾�k���Mf��:h���Z��)Nf������[�h���XK�#��yo:�V4'�{��BE �ʃ���>���@�(fDr8V������Pe��`|�:����U��h�U�ꌕ,j��p6�f���<!`��I�[J���5�̒��F�1[1�a��v5Ҳ4����}�+6c�� /k��2�j�<*�����r<0�*[^Mܥ��@�8M�qJ�tN�3f��c�Ku9t��зO�5x�\)-lޗ���{6�=�I	k�D`TȀ0�j$U�3ap{�$����,?!g3�S~D���v��L�Čk�\é:%n���<MjfEռ�71H���$�].ɘ��-n����ȁLND���Ķ�X\���@CN��T��QF}���%�'
��YQ����q�hh���@qU>ں�6-�_nr��GDA�LO-$��2c��Y+|�+{U�F�����4�x#:���ǇS^6i��1�S����h�;�ꕋ��m�D�x���J��{5���c��W��_i�ݥ���mסӒ���W��?'�^�D�ʭ�3L�u6����o��A���k.�҈Yv����WyEs�8%K ܼ7��ʤ��hT�7�� LO.�$*����-w"��%���ƒ�r�ax�C����5�4z��7e/�[��Z0Z�L�F�[t�hke/'-M��*̝�%n�s��+�  WB���TDv+�^�4�q��KcyQa�E�,BX��7<�kGX�O���6�����ʀu�qܥf29lca�s��1�}���ݕ}�Uk����h����qd��j�3Hd��c��Z}��!-\�̢��eص_��3ʰC?�ؐz�.[�T":�� �Zց�Z+��ӹ���Ez� �o�n5��n�Mek����N�P�
�MRR���L�=��y����50�K$��\��Ǝ
 $� �i�F̑����r[+ s��o�Y�a$b�����51�+jՃb|����~b�ʋ��U�ٷ�"+�ԥR�I�&�h���@ �Z($�ƅ�ǨM\yӔ�7a�	�������2m:Z�2W>���n�?*��^�}�vk�i�����U�G�x^_�Z��//�<{p�la�͆7\�	%�Y�
��%w:���b�Dv�kC�p�C� r�I�6G����L��F�p8�+f%�m�ه!i���T�ƧR��o$f[�YC�DEϒVmΌkG��e��P[��o�1
���V������[8Թ��F"��nI&ĞU���̆{-�d�t-��Ep̓ή���Ej������yl����:����7�ʖ�ph���5#F��ԧr8۱Z�ЗE4��8��U���
�ksco[����b��\9|YZ4��oq�\	��\�R׀ Ҹ��GO�VE�p�h��x��/�_=a�GY$�Cg�s��u�SM�E��-��c�+5�����\��\7n�nS�����e�ֺz�խJSl���˩����ǑZ޾G�"^)دq���(_���4#���+�j�齆ɵ�oq<��sΗ��N����>I��Z׌W�$]{��+Lm�9� �'
ŭM$dP������ ��Vp�Nw&e�1��$8bs����B-OREH�.A�ƕfEd�e�+�Ilqf\��YJQ�k\�چ�F�.D)��%[5uF}ŝ���7R��/O�]�3�H`u�i�6��}5���[���%�l/���� ���p�К����$֥K��ų9-u5��^ִ�t�"�����l�xm����� �%z�'��|MlR��{H��c�<�'A[V�����,�t"��:M0��ps���m�P�䄼��7P�,�W3MI������B�W0�u�'�)�ne�s��\�����m�N��Hܣyn�z�t""Uz��ihPej�$r�h��ps�PʭC%�6�8e�F�D�%K���6�R{���)_�iHj+^�1��+��%�� � 3:R���*ڶ��u��#��$�l`y�8��m�,46v�A!�ä�r	N�MjR�Z�f���`o�et����!�=�����w;3��z�N�l��g8a��d���m�7�"���֛�X���/�س�v�&>�pis����pk��^5��Ӽ�|��+{Ț֙m�B+^�'D��5��6O�̗��itq�BP�\-�B�����pt���Zl|P���I�������y18%�;� 1���ʵNĨ��Բ\��ƶ׹0�R���<��T�Wd���\G4��q'5�W]�԰���¥UIW5�F�gw�ZsA�8Vv��S���$�Y��X6hI3�sCP��1��*4zg��G����h�K+ð-�~l���Z�l���J+�5�D��� ��m�]������V����:�hb�L�u�)̏¡�k���y���8�F��b{h��+�	?c[F�=kg"P�H�PP�C��( �ﬞ�C���a ������K}F��$�V�&��g0��@>Q�ÕTvb��_��l�1�H�^� x +�&��b�l[t'����|	�*�M�N���6osX!�c�� A��FLUt،YZ��K����h�<��k�����Oc~����V�� ��^#��V��S�{��\x���%:�{ἒ&���y��j�L�3N�y�k���=Ö	�uY���#��� ��|�%�g��خ|����h��S���|:St��J�lZ��K�V�O+;xնƕ������ ����@y�!����Yвr�{[��1�c	q�Jqu��Ꙙ������J8�`Ml��Ԏ���gZH1�K�F�0�Z++l&��lؽ=��<u�ә�J�ܽg����.&p�I9pZ���=�^77��m�#��>rN r+��m�Q֮�S~��d��H�4JG���W��5�S�ڢ�n~v�L��QR3uEo$1J���bs�[9b��r��+f��h�D��5z��[ZN�:@�8ΏV�`tL���+hK�q`���k�7���h�C)�)$�
�eM���ͽ!k��iB�O���\H.���� �}�ю��M��m�ҕ/S�̌��%(4�#���Z�:zW=㡪umčD�BFkֱVka�VK7[���:@�*^F>%��'+�73F ����i����D@%u��Er<h���ծ�ёm��ɥF�B�T�
�2��V�O#�xF���G�k��FvRg]���r� ��� =:�e3W�9���7��0�c1��5@�ʺ�6�-��RI�pd�F��F���M`��j��-�$�ptŤ����M΃�%�V�k�L�Z���]I���We��\�I�x��*�E�8�%i�y��pǝi\���7$Vĸz@���UG�T��udtMv�x71׍i�G�g�����'fZ�]Y�֐�M�,*<Nt+��د��"G�5/5n鐨�0�ccg�#8(�D���L��q�4�i�I���]��;�dwfH����r�ן���g+Fu��U���~��J�w+/I���k���N�ۏͬ�ݿlۤl��N{����!q�/�lL�Ub��h�cPsa���빬�6Y^Z�)<3�J ���Uઞ��	9+��w,p�]�9aJ�]�e��:I4;0	ZlC�4���u��k9��=�Q"���I�V�:��{��2x�"�X\J�P] %r����R�W�-g���<G*�l�
���R2��b�ڎc�f:�.tl���8��6��K���3Z�Gl�{�CۙRN�m�$�#
S�x�`Gl��O�X�#{�T0�>Ť�E$�����X�^4�g"u�h��� (3D8U���)~F <2�!�|��P7��M��%{��R��[���"�[n�����4qUWy���nmc2m����,�B��ӕ��L�kmA-�o�E�`842q�]��Cj�8o�3��p{�=V���,��i9k�3�<��48y�`��\��NQOy��;�pƶI�J����aM�ׇ'��;�k��W�k1��0Q\��mU'r̛�,vd��7�+�������KDUƬ+~�H]+u8�Iҝ+;yM�
	��'^0?W�� �sƧ��|E���m^ڿLN/c2#̾��<�[�C�ў�+��e�.pb�Z���]U�U�1���($Ak!d��I��V�pK��o��YF�[��*P~���ƪ�h[��+�'�ƨ�;�U��zĖ��~=�hܣ_N�=�!B�\O%���ƶ/`�obY�
(xvxs��������/;n��a�I�6|��Wes+",���	�K���yR��CJYI>�ChƂ
�NA+�folթQ������� �~����z�'�uF͵�nD-�W�0��zqn�i�ݲ���r9!n��W��:��i��n�#�X1S³�E"1�٬�	ӎ#�W��s%	��g��O��2�P�r�P�rȿ��Nz�(�I���������T_�V�IdIҩ�����a����	xV����g�I3w >HHP�xfCAsgr�j�g:��%�(�v�紲v�W��u5���0�ع�,+~S�Z�t��In"-&�#�N�)�X��-[���ޔ����ʔYAWq�b�� ��yWF,���L��˨�~��ߗǚ�r�k:���M��ţd�i"R|��e�v�%mv9�V�!��Kyn@���J�Y3n���+�7 \p8�3�6V��Ѻ�GLߗ"*e��є�mƭq�ə��mK�sX�C�����A���d���K0��m��ɥs���v�������N@�p=*���eY��3�<�E�L�4[	�b5��ݞuj��%�Oӽ�c΃��
��X%mɶ
Hn�jZ�MI�n��� N2���(��Ղ�G� Sgr���_fu���Y�MS6����6�����%�ӗA\Y�
��CzyV�����}��=�L}'8&���Z�2{nJk�=yx��׆��ts����8�����]mW��̑�K�Â =�X�G���pL�Ĵ�q�1qLϾ��6���3Fb��!�tl>�e��SաH��0�i%8�Y�7Dz�Ы��	�i�Z8ҥԤB�gH����ed��nZQ�B� Ƨ�����V|@^�np*T�&�x�✪atA�dS��5
�0�ǳmR�+gsZ�NJ)�01�uC/jR�D�H ioγM��`J�������H�VesZ�,Qy�v�D��Ď',k�"�Q����1�X����X�K�.s��N��rǹ�F�\C#�g���8����Q�0�9���D�+)B3�+������H�2i/50�*������v�l+!����ʾI�%���6+�1�k�Q	
0�
��1,�3J]��b�$Q@���1^5����ҏG�����,�m�`[>`O�W���v�ձEӺI4�� �V*�o%;ۡnV���{m_�-���ͺ�T�����Sys�k��B�W����c�!�Yn9�x�]X��������� &��9�W$�����+����զ(6m7���e�r���:�-�U�hڹZБ����zWO �7p§�U�9�г��,tLG�=B��s^��4�]
W]��ȺGI�MD\q�[W7mNEI;r��i��5i̐)���\ZE8��5�:KB9�8�)�R�SJ�;{mp��H�W/�\�'��J����x\qΙ�cX[Ǘ����o{�=��2Nn��3jdF�2�^304� ���j��5bfٱ��.^��É�s�2�N!�5�ku�L�R�q>̫�ָ��|h�%hO,Α���83`��{����2p���SjM�Kp�Kp!r�X42��nYc��|(�4�Ls�#qx̌0�j��m�p-qf�C�0G-���Э#~��2)Y�[�Ϩ���֞�3�}�2c[w��,k\mu%��ao��p �8`��lv��0Ը���N��vb��k��ې��Ȉ���V�����^�*��p�C+"pcO0p�g^��F�NOJ�RWz��� HF �������6MR��	*5!��[�����c�����顃o|o�B���`{)����e��z������L�g]5�-�Yf|���k^a�S��l�b������=��h��`�:��Z���j9L?���� �)b�F-�X�Ў\G:�RO�̀���z�+j36�����6'�X1sV��u��
u4/�K����k�4�[�5٦x���)�W%��:=���K1�6�My�}��ֺ����6ߨ]�G�Ϣ�s8/�׋��r�U��c��m�����߸c�v\���b�wGZ�{3U�6� ���Y������S#�E!\CH#���HcI�VY�L ����d�4��p9*==#�Q��{�i\N�E$R�,eR�!���+�3Y��I�1�Ӓ��:�)�5� C�e�M�KpkH!q&�R:FHn#P�9/:�P%�IZ�y�CIhM�d!��$�VvՂ�``�!+j�@���U�x-J���=^�8 ����S�5�=���և�6|��Vf	�����Tā¶G2p�[.�b׺)0��=�ּ�����~-�-�kB�OJ�5�����A�W4�Tn�V�rl���@ ��v+�3?��kS��B�����!�Nƫq�b�P��#C���� ��d�p���%2@
q5�o�5���d����#7"P�0�;�W��xQoʏ[��9-N3x��բ�Y$�pIּ���Z�w<�τ�ᥓ����V6�]u,���BA�+�0�{V�9c��e�!s�ʼ�����[6�Bj����;\Q1\~Lu�+Ek�3��bn�2��s�J�:zq�Vw��ٞ �y���Q��c"2Y�K��)Ue$l_�ݮ OT�l�O,��S�ڹSr.��#j4�U5�o�7�S;�䅺t����M�:�.��%���acM�Ɔc�k*yi�^#}����9s�0+���hd����`��()B[�I��
���������(C�q�{��� ކhX��j�W������˘�����MQ�p�,7i�����������s���9g����|�"�6���q�D�Z�n�C]x֓�SV�S���-�%)�0��|q��O3_l�'��Ļ���m%ˋF�tH�4�<�Ȣ��F�@-���-0���\Z�<�r�nV���\�FX'�ַ�%�D]�������։�2X'�8���|���Db�,�cŤ��Ζ�p� d��Xnq�.�p5�r^�N��u�����s$F>F�O��<~O��G��,.g�P��1� p&����ܚ�� �� <�O�\�s^H���Lֽ� [�
�wkB.c�m��s�pR1��+��ks%9숓���N`*V���R	lmO��0�Jֹ�ώ[9�i$bZIRlܙ���\��-���
�!Ȝ~��^ ��*0��^�M�}���R'Y�܅�����V�����kZK
8�]rĖ�TD�n�W�
�r`�9cy��%�A��f�I�e���gp��Pu�|���YR֮��,>�nVn�h�1�<}�����Y~]�y�[�n���E�G+�R�����2�}�;)��۝7v�M��t��Sּ��h�Em�e�`Wb�`(�x4V�g���d����y��(���&>쩸�<��ǞT��+��!��F1��4�`}�*�`=�c��h��gܿQcP�:�jX����d�'���ØͶ��:��𬭉�4ɛ��!s��>5>��>A����~+[*4�%ahI#F})�����Heg�U�$�#x��W�H���/m[�W�����|���Ob-W&t��7w�@����FM�K�G�n��c�v85�9�fk�Y�ƺLp�E��4򊳔�]�W\~��T_+�`ڹ:���w66���UǅB;Z�����d�:��O5������S��*�q��w��4�0�n@��t�x�4Wu+]ve���Mϟ A\+�&*ۡ�O!����l��X�n8;9���n�VǡL���[��EFg��9�ħc�]�?�^��F���Z��;�V��pn�,��xt��6�-d6,���2�@�7���{:�j�-�v�#��U��L�EK���s�13P��V��e����d���nCZ��:WV;���Dp�<��+q�  󫵐*�[o�w884���LU��u��:�~�&;y@k]��
�߇���Jz3�c6�F&%��h�P�v��Щ�����&��锄�3À�q�V�����+jqf��l�!�SAE̥zk%r#�Y|n�`lr9���_�e�u-e�D�ۡp$j���#�i[�)]̝�ͽ�M�G\T��׋���cЦEcU���ql �5�5LϽl72 ��\��U],��OL�Иp���2�Ie�iUP�x֊険�:I.H3Z<�V����WU-]����,;��orn �/�F���5o��J�j�t�ެ�#k�s��^u�ڎԲ&�ւ
0*��T�H&6�H]��z��+WZ�E���]�Y�+ƴ�`�-_m�>�I�yS
�Z7&�LӹnV��ŭ�73�Z�ӥ��˓[�? {
                endMarker = startOfDay(endMarker);
            }
            if (startMarker && endMarker <= startMarker) {
                endMarker = null;
            }
        }
        if (endMarker) {
            hasEnd = true;
        }
        else if (!allowOpenRange) {
            hasEnd = calendar.opt('forceEventDuration') || false;
            endMarker = calendar.dateEnv.add(startMarker, allDay ?
                calendar.defaultAllDayEventDuration :
                calendar.defaultTimedEventDuration);
        }
        return {
            allDay: allDay,
            hasEnd: hasEnd,
            range: { start: startMarker, end: endMarker },
            forcedStartTzo: startMeta ? startMeta.forcedTzo : null,
            forcedEndTzo: endMeta ? endMeta.forcedTzo : null
        };
    }
    function pluckDateProps(raw, leftovers) {
        var props = refineProps(raw, DATE_PROPS, {}, leftovers);
        props.start = (props.start !== null) ? props.start : props.date;
        delete props.date;
        return props;
    }
    function pluckNonDateProps(raw, calendar, leftovers) {
        var preLeftovers = {};
        var props = refineProps(raw, NON_DATE_PROPS, {}, preLeftovers);
        var ui = processUnscopedUiProps(preLeftovers, calendar, leftovers);
        props.publicId = props.id;
        delete props.id;
        props.ui = ui;
        return props;
    }
    function computeIsAllDayDefault(sourceId, calendar) {
        var res = null;
        if (sourceId) {
            var source = calendar.state.eventSources[sourceId];
            res = source.allDayDefault;
        }
        if (res == null) {
            res = calendar.opt('allDayDefault');
        }
        return res;
    }

    var DEF_DEFAULTS = {
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        rendering: 'inverse-background',
        classNames: 'fc-nonbusiness',
        groupId: '_businessHours' // so multiple defs get grouped
    };
    /*
    TODO: pass around as EventDefHash!!!
    */
    function parseBusinessHours(input, calendar) {
        return parseEvents(refineInputs(input), '', calendar);
    }
    function refineInputs(input) {
        var rawDefs;
        if (input === true) {
            rawDefs = [{}]; // will get DEF_DEFAULTS verbatim
        }
        else if (Array.isArray(input)) {
            // if specifying an array, every sub-definition NEEDS a day-of-week
            rawDefs = input.filter(function (rawDef) {
                return rawDef.daysOfWeek;
            });
        }
        else if (typeof input === 'object' && input) { // non-null object
            rawDefs = [input];
        }
        else { // is probably false
            rawDefs = [];
        }
        rawDefs = rawDefs.map(function (rawDef) {
            return __assign({}, DEF_DEFAULTS, rawDef);
        });
        return rawDefs;
    }

    function memoizeRendering(renderFunc, unrenderFunc, dependencies) {
        if (dependencies === void 0) { dependencies = []; }
        var dependents = [];
        var thisContext;
        var prevArgs;
        function unrender() {
            if (prevArgs) {
                for (var _i = 0, dependents_1 = dependents; _i < dependents_1.length; _i++) {
                    var dependent = dependents_1[_i];
                    dependent.unrender();
                }
                if (unrenderFunc) {
                    unrenderFunc.apply(thisContext, prevArgs);
                }
                prevArgs = null;
            }
        }
        function res() {
            if (!prevArgs || !isArraysEqual(prevArgs, arguments)) {
                unrender();
                thisContext = this;
                prevArgs = arguments;
                renderFunc.apply(this, arguments);
            }
        }
        res.dependents = dependents;
        res.unrender = unrender;
        for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
            var dependency = dependencies_1[_i];
            dependency.dependents.push(res);
        }
        return res;
    }

    var EMPTY_EVENT_STORE = createEmptyEventStore(); // for purecomponents. TODO: keep elsewhere
    var Splitter = /** @class */ (function () {
        function Splitter() {
            this.getKeysForEventDefs = memoize(this._getKeysForEventDefs);
            this.splitDateSelection = memoize(this._splitDateSpan);
            this.splitEventStore = memoize(this._splitEventStore);
            this.splitIndividualUi = memoize(this._splitIndividualUi);
            this.splitEventDrag = memoize(this._splitInteraction);
            this.splitEventResize = memoize(this._splitInteraction);
            this.eventUiBuilders = {}; // TODO: typescript protection
        }
        Splitter.prototype.splitProps = function (props) {
            var _this = this;
            var keyInfos = this.getKeyInfo(props);
            var defKeys = this.getKeysForEventDefs(props.eventStore);
            var dateSelections = this.splitDateSelection(props.dateSelection);
            var individualUi = this.splitIndividualUi(props.eventUiBases, defKeys); // the individual *bases*
            var eventStores = this.splitEventStore(props.eventStore, defKeys);
            var eventDrags = this.splitEventDrag(props.eventDrag);
            var eventResizes = this.splitEventResize(props.eventResize);
            var splitProps = {};
            this.eventUiBuilders = mapHash(keyInfos, function (info, key) {
                return _this.eventUiBuilders[key] || memoize(buildEventUiForKey);
            });
            for (var key in keyInfos) {
                var keyInfo = keyInfos[key];
                var eventStore = eventStores[key] || EMPTY_EVENT_STORE;
                var buildEventUi = this.eventUiBuilders[key];
                splitProps[key] = {
                    businessHours: keyInfo.businessHours || props.businessHours,
                    dateSelection: dateSelections[key] || null,
                    eventStore: eventStore,
                    eventUiBases: buildEventUi(props.eventUiBases[''], keyInfo.ui, individualUi[key]),
                    eventSelection: eventStore.instances[props.eventSelection] ? props.eventSelection : '',
                    eventDrag: eventDrags[key] || null,
                    eventResize: eventResizes[key] || null
                };
            }
            return splitProps;
        };
        Splitter.prototype._splitDateSpan = function (dateSpan) {
            var dateSpans = {};
            if (dateSpan) {
                var keys = this.getKeysForDateSpan(dateSpan);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    dateSpans[key] = dateSpan;
                }
            }
            return dateSpans;
        };
        Splitter.prototype._getKeysForEventDefs = function (eventStore) {
            var _this = this;
            return mapHash(eventStore.defs, function (eventDef) {
                return _this.getKeysForEventDef(eventDef);
            });
        };
        Splitter.prototype._splitEventStore = function (eventStore, defKeys) {
            var defs = eventStore.defs, instances = eventStore.instances;
            var splitStores = {};
            for (var defId in defs) {
                for (var _i = 0, _a = defKeys[defId]; _i < _a.length; _i++) {
                    var key = _a[_i];
                    if (!splitStores[key]) {
                        splitStores[key] = createEmptyEventStore();
                    }
                    splitStores[key].defs[defId] = defs[defId];
                }
            }
            for (var instanceId in instances) {
                var instance = instances[instanceId];
                for (var _b = 0, _c = defKeys[instance.defId]; _b < _c.length; _b++) {
                    var key = _c[_b];
                    if (splitStores[key]) { // must have already been created
                        splitStores[key].instances[instanceId] = instance;
                    }
                }
            }
            return splitStores;
        };
        Splitter.prototype._splitIndividualUi = function (eventUiBases, defKeys) {
            var splitHashes = {};
            for (var defId in eventUiBases) {
                if (defId) { // not the '' key
                    for (var _i = 0, _a = defKeys[defId]; _i < _a.length; _i++) {
                        var key = _a[_i];
                        if (!splitHashes[key]) {
                            splitHashes[key] = {};
                        }
                        splitHashes[key][defId] = eventUiBases[defId];
                    }
                }
            }
            return splitHashes;
        };
        Splitter.prototype._splitInteraction = function (interaction) {
            var splitStates = {};
            if (interaction) {
                var affectedStores_1 = this._splitEventStore(interaction.affectedEvents, this._getKeysForEventDefs(interaction.affectedEvents) // can't use cached. might be events from other calendar
                );
                // can't rely on defKeys because event data is mutated
                var mutatedKeysByDefId = this._getKeysForEventDefs(interaction.mutatedEvents);
                var mutatedStores_1 = this._splitEventStore(interaction.mutatedEvents, mutatedKeysByDefId);
                var populate = function (key) {
                    if (!splitStates[key]) {
                        splitStates[key] = {
                            affectedEvents: affectedStores_1[key] || EMPTY_EVENT_STORE,
                            mutatedEvents: mutatedStores_1[key] || EMPTY_EVENT_STORE,
                            isEvent: interaction.isEvent,
                            origSeg: interaction.origSeg
                        };
                    }
                };
                for (var key in affectedStores_1) {
                    populate(key);
                }
                for (var key in mutatedStores_1) {
                    populate(key);
                }
            }
            return splitStates;
        };
        return Splitter;
    }());
    function buildEventUiForKey(allUi, eventUiForKey, individualUi) {
        var baseParts = [];
        if (allUi) {
            baseParts.push(allUi);
        }
        if (eventUiForKey) {
            baseParts.push(eventUiForKey);
        }
        var stuff = {
            '': combineEventUis(baseParts)
        };
        if (individualUi) {
            __assign(stuff, individualUi);
        }
        return stuff;
    }

    // Generates HTML for an anchor to another view into the calendar.
    // Will either generate an <a> tag or a non-clickable <span> tag, depending on enabled settings.
    // `gotoOptions` can either be a DateMarker, or an object with the form:
    // { date, type, forceOff }
    // `type` is a view-type like "day" or "week". default value is "day".
    // `attrs` and `innerHtml` are use to generate the rest of the HTML tag.
    function buildGotoAnchorHtml(allOptions, dateEnv, gotoOptions, attrs, innerHtml) {
        var date;
        var type;
        var forceOff;
        var finalOptions;
        if (gotoOptions instanceof Date) {
            date = gotoOptions; // a single date-like input
        }
        else {
            date = gotoOptions.date;
            type = gotoOptions.type;
            forceOff = gotoOptions.forceOff;
        }
        finalOptions = {
            date: dateEnv.formatIso(date, { omitTime: true }),
            type: type || 'day'
        };
        if (typeof attrs === 'string') {
            innerHtml = attrs;
            attrs = null;
        }
        attrs = attrs ? ' ' + attrsToStr(attrs) : ''; // will have a leading space
        innerHtml = innerHtml || '';
        if (!forceOff && allOptions.navLinks) {
            return '<a' + attrs +
                ' data-goto="' + htmlEscape(JSON.stringify(finalOptions)) + '">' +
                innerHtml +
                '</a>';
        }
        else {
            return '<span' + attrs + '>' +
                innerHtml +
                '</span>';
        }
    }
    function getAllDayHtml(allOptions) {
        return allOptions.allDayHtml || htmlEscape(allOptions.allDayText);
    }
    // Computes HTML classNames for a single-day element
    function getDayClasses(date, dateProfile, context, noThemeHighlight) {
        var calendar = context.calendar, options = context.options, theme = context.theme, dateEnv = context.dateEnv;
        var classes = [];
        var todayStart;
        var todayEnd;
        if (!rangeContainsMarker(dateProfile.activeRange, date)) {
            classes.push('fc-disabled-day');
        }
        else {
            classes.push('fc-' + DAY_IDS[date.getUTCDay()]);
            if (options.monthMode &&
                dateEnv.getMonth(date) !== dateEnv.getMonth(dateProfile.currentRange.start)) {
                classes.push('fc-other-month');
            }
            todayStart = startOfDay(calendar.getNow());
            todayEnd = addDays(todayStart, 1);
            if (date < todayStart) {
                classes.push('fc-past');
            }
            else if (date >= todayEnd) {
                classes.push('fc-future');
            }
            else {
                classes.push('fc-today');
                if (noThemeHighlight !== true) {
                    classes.push(theme.getClass('today'));
                }
            }
        }
        return classes;
    }

    // given a function that resolves a result asynchronously.
    // the function can either call passed-in success and failure callbacks,
    // or it can return a promise.
    // if you need to pass additional params to func, bind them first.
    function unpromisify(func, success, failure) {
        // guard against success/failure callbacks being called more than once
        // and guard against a promise AND callback being used together.
        var isResolved = false;
        var wrappedSuccess = function () {
            if (!isResolved) {
                isResolved = true;
                success.apply(this, arguments);
            }
        };
        var wrappedFailure = function () {
            if (!isResolved) {
                isResolved = true;
                if (failure) {
                    failure.apply(this, arguments);
                }
            }
        };
        var res = func(wrappedSuccess, wrappedFailure);
        if (res && typeof res.then === 'function') {
            res.then(wrappedSuccess, wrappedFailure);
        }
    }

    var Mixin = /** @class */ (function () {
        function Mixin() {
        }
        // mix into a CLASS
        Mixin.mixInto = function (destClass) {
            this.mixIntoObj(destClass.prototype);
        };
        // mix into ANY object
        Mixin.mixIntoObj = function (destObj) {
            var _this = this;
            Object.getOwnPropertyNames(this.prototype).forEach(function (name) {
                if (!destObj[name]) { // if destination doesn't already define it
                    destObj[name] = _this.prototype[name];
                }
            });
        };
        /*
        will override existing methods
        TODO: remove! not used anymore
        */
        Mixin.mixOver = function (destClass) {
            var _this = this;
            Object.getOwnPropertyNames(this.prototype).forEach(function (name) {
                destClass.prototype[name] = _this.prototype[name];
            });
        };
        return Mixin;
    }());

    /*
    USAGE:
      import { default as EmitterMixin, EmitterInterface } from './EmitterMixin'
    in class:
      on: EmitterInterface['on']
      one: EmitterInterface['one']
      off: EmitterInterface['off']
      trigger: EmitterInterface['trigger']
      triggerWith: EmitterInterface['triggerWith']
      hasHandlers: EmitterInterface['hasHandlers']
    after class:
      EmitterMixin.mixInto(TheClass)
    */
    var EmitterMixin = /** @class */ (function (_super) {
        __extends(EmitterMixin, _super);
        function EmitterMixin() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmitterMixin.prototype.on = function (type, handler) {
            addToHash(this._handlers || (this._handlers = {}), type, handler);
            return this; // for chaining
        };
        // todo: add comments
        EmitterMixin.prototype.one = function (type, handler) {
            addToHash(this._oneHandlers || (this._oneHandlers = {}), type, handler);
            return this; // for chaining
        };
        EmitterMixin.prototype.off = function (type, handler) {
            if (this._handlers) {
                removeFromHash(this._handlers, type, handler);
            }
            if (this._oneHandlers) {
                removeFromHash(this._oneHandlers, type, handler);
            }
            return this; // for chaining
        };
        EmitterMixin.prototype.trigger = function (type) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.triggerWith(type, this, args);
            return this; // for chaining
        };
        EmitterMixin.prototype.triggerWith = function (type, context, args) {
            if (this._handlers) {
                applyAll(this._handlers[type], context, args);
            }
            if (this._oneHandlers) {
                applyAll(this._oneHandlers[type], context, args);
                delete this._oneHandlers[type]; // will never fire again
            }
            return this; // for chaining
        };
        EmitterMixin.prototype.hasHandlers = function (type) {
            return (this._handlers && this._handlers[type] && this._handlers[type].length) ||
                (this._oneHandlers && this._oneHandlers[type] && this._oneHandlers[type].length);
        };
        return EmitterMixin;
    }(Mixin));
    function addToHash(hash, type, handler) {
        (hash[type] || (hash[type] = []))
            .push(handler);
    }
    function removeFromHash(hash, type, handler) {
        if (handler) {
            if (hash[type]) {
                hash[type] = hash[type].filter(function (func) {
                    return func !== handler;
                });
            }
        }
        else {
            delete hash[type]; // remove all handler funcs for this type
        }
    }

    /*
    Records offset information for a set of elements, relative to an origin element.
    Can record the left/right OR the top/bottom OR both.
    Provides methods for querying the cache by position.
    */
    var PositionCache = /** @class */ (function () {
        function PositionCache(originEl, els, isHorizontal, isVertical) {
            this.originEl = originEl;
            this.els = els;
            this.isHorizontal = isHorizontal;
            this.isVertical = isVertical;
        }
        // Queries the els for coordinates and stores them.
        // Call this method before using and of the get* methods below.
        PositionCache.prototype.build = function () {
            var originEl = this.originEl;
            var originClientRect = this.originClientRect =
                originEl.getBoundingClientRect(); // relative to viewport top-left
            if (this.isHorizontal) {
                this.buildElHorizontals(originClientRect.left);
            }
            if (this.isVertical) {
                this.buildElVerticals(originClientRect.top);
            }
        };
        // Populates the left/right internal coordinate arrays
        PositionCache.prototype.buildElHorizontals = function (originClientLeft) {
            var lefts = [];
            var rights = [];
            for (var _i = 0, _a = this.els; _i < _a.length; _i++) {
                var el = _a[_i];
                var rect = el.getBoundingClientRect();
                lefts.push(rect.left - originClientLeft);
                rights.push(rect.right - originClientLeft);
            }
            this.lefts = lefts;
            this.rights = rights;
        };
        // Populates the top/bottom internal coordinate arrays
        PositionCache.prototype.buildElVerticals = function (originClientTop) {
            var tops = [];
            var bottoms = [];
            for (var _i = 0, _a = this.els; _i < _a.length; _i++) {
                var el = _a[_i];
                var rect = el.getBoundingClientRect();
                tops.push(rect.top - originClientTop);
                bottoms.push(rect.bottom - originClientTop);
            }
            this.tops = tops;
            this.bottoms = bottoms;
        };
        // Given a left offset (from document left), returns the index of the el that it horizontally intersects.
        // If no intersection is made, returns undefined.
        PositionCache.prototype.leftToIndex = function (leftPosition) {
            var lefts = this.lefts;
            var rights = this.rights;
            var len = lefts.length;
            var i;
            for (i = 0; i < len; i++) {
                if (leftPosition >= lefts[i] && leftPosition < rights[i]) {
                    return i;
                }
            }
        };
        // Given a top offset (from document top), returns the index of the el that it vertically intersects.
        // If no intersection is made, returns undefined.
        PositionCache.prototype.topToIndex = function (topPosition) {
            var tops = this.tops;
            var bottoms = this.bottoms;
            var len = tops.length;
            var i;
            for (i = 0; i < len; i++) {
                if (topPosition >= tops[i] && topPosition < bottoms[i]) {
                    return i;
                }
            }
        };
        // Gets the width of the element at the given index
        PositionCache.prototype.getWidth = function (leftIndex) {
            return this.rights[leftIndex] - this.lefts[leftIndex];
        };
        // Gets the height of the element at the given index
        PositionCache.prototype.getHeight = function (topIndex) {
            return this.bottoms[topIndex] - this.tops[topIndex];
        };
        return PositionCache;
    }());

    /*
    An object for getting/setting scroll-related information for an element.
    Internally, this is done very differently for window versus DOM element,
    so this object serves as a common interface.
    */
    var ScrollController = /** @class */ (function () {
        function ScrollController() {
        }
        ScrollController.prototype.getMaxScrollTop = function () {
            return this.getScrollHeight() - this.getClientHeight();
        };
        ScrollController.prototype.getMaxScrollLeft = function () {
            return this.getScrollWidth() - this.getClientWidth();
        };
        ScrollController.prototype.canScrollVertically = function () {
            return this.getMaxScrollTop() > 0;
        };
        ScrollController.prototype.canScrollHorizontally = function () {
            return this.getMaxScrollLeft() > 0;
        };
        ScrollController.prototype.canScrollUp = function () {
            return this.getScrollTop() > 0;
        };
        ScrollController.prototype.canScrollDown = function () {
            return this.getScrollTop() < this.getMaxScrollTop();
        };
        ScrollController.prototype.canScrollLeft = function () {
            return this.getScrollLeft() > 0;
        };
        ScrollController.prototype.canScrollRight = function () {
            return this.getScrollLeft() < this.getMaxScrollLeft();
        };
        return ScrollController;
    }());
    var ElementScrollController = /** @class */ (function (_super) {
        __extends(ElementScrollController, _super);
        function ElementScrollController(el) {
            var _this = _super.call(this) || this;
            _this.el = el;
            return _this;
        }
        ElementScrollController.prototype.getScrollTop = function () {
            return this.el.scrollTop;
        };
        ElementScrollController.prototype.getScrollLeft = function () {
            return this.el.scrollLeft;
        };
        ElementScrollController.prototype.setScrollTop = function (top) {
            this.el.scrollTop = top;
        };
        ElementScrollController.prototype.setScrollLeft = function (left) {
            this.el.scrollLeft = left;
        };
        ElementScrollController.prototype.getScrollWidth = function () {
            return this.el.scrollWidth;
        };
        ElementScrollController.prototype.getScrollHeight = function () {
            return this.el.scrollHeight;
        };
        ElementScrollController.prototype.getClientHeight = function () {
            return this.el.clientHeight;
        };
        ElementScrollController.prototype.getClientWidth = function () {
            return this.el.clientWidth;
        };
        return ElementScrollController;
    }(ScrollController));
    var WindowScrollController = /** @class */ (function (_super) {
        __extends(WindowScrollController, _super);
        function WindowScrollController() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        WindowScrollController.prototype.getScrollTop = function () {
            return window.pageYOffset;
        };
        WindowScrollController.prototype.getScrollLeft = function () {
            return window.pageXOffset;
        };
        WindowScrollController.prototype.setScrollTop = function (n) {
            window.scroll(window.pageXOffset, n);
        };
        WindowScrollController.prototype.setScrollLeft = function (n) {
            window.scroll(n, window.pageYOffset);
        };
        WindowScrollController.prototype.getScrollWidth = function () {
            return document.documentElement.scrollWidth;
        };
        WindowScrollController.prototype.getScrollHeight = function () {
            return document.documentElement.scrollHeight;
        };
        WindowScrollController.prototype.getClientHeight = function () {
            return document.documentElement.clientHeight;
        };
        WindowScrollController.prototype.getClientWidth = function () {
            return document.documentElement.clientWidth;
        };
        return WindowScrollController;
    }(ScrollController));

    /*
    Embodies a div that has potential scrollbars
    */
    var ScrollComponent = /** @class */ (function (_super) {
        __extends(ScrollComponent, _super);
        function ScrollComponent(overflowX, overflowY) {
            var _this = _super.call(this, createElement('div', {
                className: 'fc-scroller'
            })) || this;
            _this.overflowX = overflowX;
            _this.overflowY = overflowY;
            _this.applyOverflow();
            return _this;
        }
        // sets to natural height, unlocks overflow
        ScrollComponent.prototype.clear = function () {
            this.setHeight('auto');
            this.applyOverflow();
        };
        ScrollComponent.prototype.destroy = function () {
            removeElement(this.el);
        };
        // Overflow
        // -----------------------------------------------------------------------------------------------------------------
        ScrollComponent.prototype.applyOverflow = function () {
            applyStyle(this.el, {
                overflowX: this.overflowX,
                overflowY: this.overflowY
            });
        };
        // Causes any 'auto' overflow values to resolves to 'scroll' or 'hidden'.
        // Useful for preserving scrollbar widths regardless of future resizes.
        // Can pass in scrollbarWidths for optimization.
        ScrollComponent.prototype.lockOverflow = function (scrollbarWidths) {
            var overflowX = this.overflowX;
            var overflowY = this.overflowY;
            scrollbarWidths = scrollbarWidths || this.getScrollbarWidths();
            if (overflowX === 'auto') {
                overflowX = (scrollbarWidths.bottom || // horizontal scrollbars?
                    this.canScrollHorizontally() // OR scrolling pane with massless scrollbars?
                ) ? 'scroll' : 'hidden';
            }
            if (overflowY === 'auto') {
                overflowY = (scrollbarWidths.left || scrollbarWidths.right || // horizontal scrollbars?
                    this.canScrollVertically() // OR scrolling pane with massless scrollbars?
                ) ? 'scroll' : 'hidden';
            }
            applyStyle(this.el, { overflowX: overflowX, overflowY: overflowY });
        };
        ScrollComponent.prototype.setHeight = function (height) {
            applyStyleProp(this.el, 'height', height);
        };
        ScrollComponent.prototype.getScrollbarWidths = function () {
            var edges = computeEdges(this.el);
            return {
                left: edges.scrollbarLeft,
                right: edges.scrollbarRight,
                bottom: edges.scrollbarBottom
            };
        };
        return ScrollComponent;
    }(ElementScrollController));

    var Theme = /** @class */ (function () {
        function Theme(calendarOptions) {
            this.calendarOptions = calendarOptions;
            this.processIconOverride();
        }
        Theme.prototype.processIconOverride = function () {
            if (this.iconOverrideOption) {
                this.setIconOverride(this.calendarOptions[this.iconOverrideOption]);
            }
        };
        Theme.prototype.setIconOverride = function (iconOverrideHash) {
            var iconClassesCopy;
            var buttonName;
            if (typeof iconOverrideHash === 'object' && iconOverrideHash) { // non-null object
                iconClassesCopy = __assign({}, this.iconClasses);
                for (buttonName in iconOverrideHash) {
                    iconClassesCopy[buttonName] = this.applyIconOverridePrefix(iconOverrideHash[buttonName]);
                }
                this.iconClasses = iconClassesCopy;
            }
            else if (iconOverrideHash === false) {
                this.iconClasses = {};
            }
        };
        Theme.prototype.applyIconOverridePrefix = function (className) {
            var prefix = this.iconOverridePrefix;
            if (prefix && className.indexOf(prefix) !== 0) { // if not already present
                className = prefix + className;
            }
            return className;
        };
        Theme.prototype.getClass = function (key) {
            return this.classes[key] || '';
        };
        Theme.prototype.getIconClass = function (buttonName) {
            var className = this.iconClasses[buttonName];
            if (className) {
                return this.baseIconClass + ' ' + className;
            }
            return '';
        };
        Theme.prototype.getCustomButtonIconClass = function (customButtonProps) {
            var className;
            if (this.iconOverrideCustomButtonOption) {
                className = customButtonProps[this.iconOverrideCustomButtonOption];
                if (className) {
                    return this.baseIconClass + ' ' + this.applyIconOverridePrefix(className);
                }
            }
            return '';
        };
        return Theme;
    }());
    Theme.prototype.classes = {};
    Theme.prototype.iconClasses = {};
    Theme.prototype.baseIconClass = '';
    Theme.prototype.iconOverridePrefix = '';

    var guid = 0;
    var ComponentContext = /** @class */ (function () {
        function ComponentContext(calendar, theme, dateEnv, options, view) {
            this.calendar = calendar;
            this.theme = theme;
            this.dateEnv = dateEnv;
            this.options = options;
            this.view = view;
            this.isRtl = options.dir === 'rtl';
            this.eventOrderSpecs = parseFieldSpecs(options.eventOrder);
            this.nextDayThreshold = createDuration(options.nextDayThreshold);
        }
        ComponentContext.prototype.extend = function (options, view) {
            return new ComponentContext(this.calendar, this.theme, this.dateEnv, options || this.options, view || this.view);
        };
        return ComponentContext;
    }());
    var Component = /** @class */ (function () {
        function Component() {
            this.everRendered = false;
            this.uid = String(guid++);
        }
        Component.addEqualityFuncs = function (newFuncs) {
            this.prototype.equalityFuncs = __assign({}, this.prototype.equalityFuncs, newFuncs);
        };
        Component.prototype.receiveProps = function (props, context) {
            this.receiveContext(context);
            var _a = recycleProps(this.props || {}, props, this.equalityFuncs), anyChanges = _a.anyChanges, comboProps = _a.comboProps;
            this.props = comboProps;
            if (anyChanges) {
                if (this.everRendered) {
                    this.beforeUpdate();
                }
                this.render(comboProps, context);
                if (this.everRendered) {
                    this.afterUpdate();
                }
            }
            this.everRendered = true;
        };
        Component.prototype.receiveContext = function (context) {
            var oldContext = this.context;
            this.context = context;
            if (!oldContext) {
                this.firstContext(context);
            }
        };
        Component.prototype.render = function (props, context) {
        };
        Component.prototype.firstContext = function (context) {
        };
        Component.prototype.beforeUpdate = function () {
        };
        Component.prototype.afterUpdate = function () {
        };
        // after destroy is called, this component won't ever be used again
        Component.prototype.destroy = function () {
        };
        return Component;
    }());
    Component.prototype.equalityFuncs = {};
    /*
    Reuses old values when equal. If anything is unequal, returns newProps as-is.
    Great for PureComponent, but won't be feasible with React, so just eliminate and use React's DOM diffing.
    */
    function recycleProps(oldProps, newProps, equalityFuncs) {
        var comboProps = {}; // some old, some new
        var anyChanges = false;
        for (var key in newProps) {
            if (key in oldProps && (oldProps[key] === newProps[key] ||
                (equalityFuncs[key] && equalityFuncs[key](oldProps[key], newProps[key])))) {
                // equal to old? use old prop
                comboProps[key] = oldProps[key];
            }
            else {
                comboProps[key] = newProps[key];
                anyChanges = true;
            }
        }
        for (var key in oldProps) {
            if (!(key in newProps)) {
                anyChanges = true;
                break;
            }
        }
        return { anyChanges: anyChanges, comboProps: comboProps };
    }

    /*
    PURPOSES:
    - hook up to fg, fill, and mirror renderers
    - interface for dragging and hits
    */
    var DateComponent = /** @class */ (function (_super) {
        __extends(DateComponent, _super);
        function DateComponent(el) {
            var _this = _super.call(this) || this;
            _this.el = el;
            return _this;
        }
        DateComponent.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            removeElement(this.el);
        };
        // Hit System
        // -----------------------------------------------------------------------------------------------------------------
        DateComponent.prototype.buildPositionCaches = function () {
        };
        DateComponent.prototype.queryHit = function (positionLeft, positionTop, elWidth, elHeight) {
            return null; // this should be abstract
        };
        // Validation
        // -----------------------------------------------------------------------------------------------------------------
        DateComponent.prototype.isInteractionValid = function (interaction) {
            var calendar = this.context.calendar;
            var dateProfile = this.props.dateProfile; // HACK
            var instances = interaction.mutatedEvents.instances;
            if (dateProfile) { // HACK for DayTile
                for (var instanceId in instances) {
                    if (!rangeContainsRange(dateProfile.validRange, instances[instanceId].range)) {
                        return false;
                    }
                }
            }
            return isInteractionValid(interaction, calendar);
        };
        DateComponent.prototype.isDateSelectionValid = function (selection) {
            var calendar = this.context.calendar;
            var dateProfile = this.props.dateProfile; // HACK
            if (dateProfile && // HACK for DayTile
                !rangeContainsRange(dateProfile.validRange, selection.range)) {
                return false;
            }
            return isDateSelectionValid(selection, calendar);
        };
        // Pointer Interaction Utils
        // -----------------------------------------------------------------------------------------------------------------
        DateComponent.prototype.isValidSegDownEl = function (el) {
            return !this.props.eventDrag && // HACK
                !this.props.eventResize && // HACK
                !elementClosest(el, '.fc-mirror') &&
                (this.isPopover() || !this.isInPopover(el));
            // ^above line ensures we don't detect a seg interaction within a nested component.
            // it's a HACK because it only supports a popover as the nested component.
        };
        DateComponent.prototype.isValidDateDownEl = function (el) {
            var segEl = elementClosest(el, this.fgSegSelector);
            return (!segEl || segEl.classList.contains('fc-mirror')) &&
                !elementClosest(el, '.fc-more') && // a "more.." link
                !elementClosest(el, 'a[data-goto]') && // a clickable nav link
                !this.isInPopover(el);
        };
        DateComponent.prototype.isPopover = function () {
            return this.el.classList.contains('fc-popover');
        };
        DateComponent.prototype.isInPopover = function (el) {
            return Boolean(elementClosest(el, '.fc-popover'));
        };
        return DateComponent;
    }(Component));
    DateComponent.prototype.fgSegSelector = '.fc-event-container > *';
    DateComponent.prototype.bgSegSelector = '.fc-bgevent:not(.fc-nonbusiness)';

    var uid$1 = 0;
    function createPlugin(input) {
        return {
            id: String(uid$1++),
            deps: input.deps || [],
            reducers: input.reducers || [],
            eventDefParsers: input.eventDefParsers || [],
            isDraggableTransformers: input.isDraggableTransformers || [],
            eventDragMutationMassagers: input.eventDragMutationMassagers || [],
            eventDefMutationAppliers: input.eventDefMutationAppliers || [],
            dateSelectionTransformers: input.dateSelectionTransformers || [],
            datePointTransforms: input.datePointTransforms || [],
            dateSpanTransforms: input.dateSpanTransforms || [],
            views: input.views || {},
            viewPropsTransformers: input.viewPropsTransformers || [],
            isPropsValid: input.isPropsValid || null,
            externalDefTransforms: input.externalDefTransforms || [],
            eventResizeJoinTransforms: input.eventResizeJoinTransforms || [],
            viewContainerModifiers: input.viewContainerModifiers || [],
            eventDropTransformers: input.eventDropTransformers || [],
            componentInteractions: input.componentInteractions || [],
            calendarInteractions: input.calendarInteractions || [],
            themeClasses: input.themeClasses || {},
            eventSourceDefs: input.eventSourceDefs || [],
            cmdFormatter: input.cmdFormatter,
            recurringTypes: input.recurringTypes || [],
            namedTimeZonedImpl: input.namedTimeZonedImpl,
            defaultView: input.defaultView || '',
            elementDraggingImpl: input.elementDraggingImpl,
            optionChangeHandlers: input.optionChangeHandlers || {}
        };
    }
    var PluginSystem = /** @class */ (function () {
        function PluginSystem() {
            this.hooks = {
                reducers: [],
                eventDefParsers: [],
                isDraggableTransformers: [],
                eventDragMutationMassagers: [],
                eventDefMutationAppliers: [],
                dateSelectionTransformers: [],
                datePointTransforms: [],
                dateSpanTransforms: [],
                views: {},
                viewPropsTransformers: [],
                isPropsValid: null,
                externalDefTransforms: [],
                eventResizeJoinTransforms: [],
                viewContainerModifiers: [],
                eventDropTransformers: [],
                componentInteractions: [],
                calendarInteractions: [],
                themeClasses: {},
                eventSourceDefs: [],
                cmdFormatter: null,
                recurringTypes: [],
                namedTimeZonedImpl: null,
                defaultView: '',
                elementDraggingImpl: null,
                optionChangeHandlers: {}
            };
            this.addedHash = {};
        }
        PluginSystem.prototype.add = function (plugin) {
            if (!this.addedHash[plugin.id]) {
                this.addedHash[plugin.id] = true;
                for (var _i = 0, _a = plugin.deps; _i < _a.length; _i++) {
                    var dep = _a[_i];
                    this.add(dep);
                }
                this.hooks = combineHooks(this.hooks, plugin);
            }
        };
        return PluginSystem;
    }());
    function combineHooks(hooks0, hooks1) {
        return {
            reducers: hooks0.reducers.concat(hooks1.reducers),
            eventDefParsers: hooks0.eventDefParsers.concat(hooks1.eventDefParsers),
            isDraggableTransformers: hooks0.isDraggableTransformers.concat(hooks1.isDraggableTransformers),
            eventDragMutationMassagers: hooks0.eventDragMutationMassagers.concat(hooks1.eventDragMutationMassagers),
            eventDefMutationAppliers: hooks0.eventDefMutationAppliers.concat(hooks1.eventDefMutationAppliers),
            dateSelectionTransformers: hooks0.dateSelectionTransformers.concat(hooks1.dateSelectionTransformers),
            datePointTransforms: hooks0.datePointTransforms.concat(hooks1.datePointTransforms),
            dateSpanTransforms: hooks0.dateSpanTransforms.concat(hooks1.dateSpanTransforms),
            views: __assign({}, hooks0.views, hooks1.views),
            viewPropsTransformers: hooks0.viewPropsTransformers.concat(hooks1.viewPropsTransformers),
            isPropsValid: hooks1.isPropsValid || hooks0.isPropsValid,
            externalDefTransforms: hooks0.externalDefTransforms.concat(hooks1.externalDefTransforms),
            eventResizeJoinTransforms: hooks0.eventResizeJoinTransforms.concat(hooks1.eventResizeJoinTransforms),
            viewContainerModifiers: hooks0.viewContainerModifiers.concat(hooks1.viewContainerModifiers),
            eventDropTransformers: hooks0.eventDropTransformers.concat(hooks1.eventDropTransformers),
            calendarInteractions: hooks0.calendarInteractions.concat(hooks1.calendarInteractions),
            componentInteractions: hooks0.componentInteractions.concat(hooks1.componentInteractions),
            themeClasses: __assign({}, hooks0.themeClasses, hooks1.themeClasses),
            eventSourceDefs: hooks0.eventSourceDefs.concat(hooks1.eventSourceDefs),
            cmdFormatter: hooks1.cmdFormatter || hooks0.cmdFormatter,
            recurringTypes: hooks0.recurringTypes.concat(hooks1.recurringTypes),
            namedTimeZonedImpl: hooks1.namedTimeZonedImpl || hooks0.namedTimeZonedImpl,
            defaultView: hooks0.defaultView || hooks1.defaultView,
            elementDraggingImpl: hooks0.elementDraggingImpl || hooks1.elementDraggingImpl,
            optionChangeHandlers: __assign({}, hooks0.optionChangeHandlers, hooks1.optionChangeHandlers)
        };
    }

    var eventSourceDef = {
        ignoreRange: true,
        parseMeta: function (raw) {
            if (Array.isArray(raw)) { // short form
                return raw;
            }
            else if (Array.isArray(raw.events)) {
                return raw.events;
            }
            return null;
        },
        fetch: function (arg, success) {
            success({
                rawEvents: arg.eventSource.meta
            });
        }
    };
    var ArrayEventSourcePlugin = createPlugin({
        eventSourceDefs: [eventSourceDef]
    });

    var eventSourceDef$1 = {
        parseMeta: function (raw) {
            if (typeof raw === 'function') { // short form
                return raw;
            }
            else if (typeof raw.events === 'function') {
                return raw.events;
            }
            return null;
        },
        fetch: function (arg, success, failure) {
            var dateEnv = arg.calendar.dateEnv;
            var func = arg.eventSource.meta;
            unpromisify(func.bind(null, {
                start: dateEnv.toDate(arg.range.start),
                end: dateEnv.toDate(arg.range.end),
                startStr: dateEnv.formatIso(arg.range.start),
                endStr: dateEnv.formatIso(arg.range.end),
                timeZone: dateEnv.timeZone
            }), function (rawEvents) {
                success({ rawEvents: rawEvents }); // needs an object response
            }, failure // send errorObj directly to failure callback
            );
        }
    };
    var FuncEventSourcePlugin = createPlugin({
        eventSourceDefs: [eventSourceDef$1]
    });

    function requestJson(method, url, params, successCallback, failureCallback) {
        method = method.toUpperCase();
        var body = null;
        if (method === 'GET') {
            url = injectQueryStringParams(url, params);
        }
        else {
            body = encodeParams(params);
        }
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (method !== 'GET') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 400) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    successCallback(res, xhr);
                }
                catch (err) {
                    failureCallback('Failure parsing JSON', xhr);
                }
            }
            else {
                failureCallback('Request failed', xhr);
            }
        };
        xhr.onerror = function () {
            failureCallback('Request failed', xhr);
        };
        xhr.send(body);
    }
    function injectQueryStringParams(url, params) {
        return url +
            (url.indexOf('?') === -1 ? '?' : '&') +
            encodeParams(params);
    }
    function encodeParams(params) {
        var parts = [];
        for (var key in params) {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
        return parts.join('&');
    }

    var eventSourceDef$2 = {
        parseMeta: function (raw) {
            if (typeof raw === 'string') { // short form
                raw = { url: raw };
            }
            else if (!raw || typeof raw !== 'object' || !raw.url) {
                return null;
            }
            return {
                url: raw.url,
                method: (raw.method || 'GET').toUpperCase(),
                extraParams: raw.extraParams,
                startParam: raw.startParam,
                endParam: raw.endParam,
                timeZoneParam: raw.timeZoneParam
            };
        },
        fetch: function (arg, success, failure) {
            var meta = arg.eventSource.meta;
            var requestParams = buildRequestParams(meta, arg.range, arg.calendar);
            requestJson(meta.method, meta.url, requestParams, function (rawEvents, xhr) {
                success({ rawEvents: rawEvents, xhr: xhr });
            }, function (errorMessage, xhr) {
                failure({ message: errorMessage, xhr: xhr });
            });
        }
    };
    var JsonFeedEventSourcePlugin = createPlugin({
        eventSourceDefs: [eventSourceDef$2]
    });
    function buildRequestParams(meta, range, calendar) {
        var dateEnv = calendar.dateEnv;
        var startParam;
        var endParam;
        var timeZoneParam;
        var customRequestParams;
        var params = {};
        startParam = meta.startParam;
        if (startParam == null) {
            startParam = calendar.opt('startParam');
        }
        endParam = meta.endParam;
        if (endParam == null) {
            endParam = calendar.opt('endParam');
        }
        timeZoneParam = meta.timeZoneParam;
        if (timeZoneParam == null) {
            timeZoneParam = calendar.opt('timeZoneParam');
        }
        // retrieve any outbound GET/POST data from the options
        if (typeof meta.extraParams === 'function') {
            // supplied as a function that returns a key/value object
            customRequestParams = meta.extraParams();
        }
        else {
            // probably supplied as a straight key/value object
            customRequestParams = meta.extraParams || {};
        }
        __assign(params, customRequestParams);
        params[startParam] = dateEnv.formatIso(range.start);
        params[endParam] = dateEnv.formatIso(range.end);
        if (dateEnv.timeZone !== 'local') {
            params[timeZoneParam] = dateEnv.timeZone;
        }
        return params;
    }

    var recurring = {
        parse: function (rawEvent, leftoverProps, dateEnv) {
            var createMarker = dateEnv.createMarker.bind(dateEnv);
            var processors = {
                daysOfWeek: null,
                startTime: createDuration,
                endTime: createDuration,
                startRecur: createMarker,
                endRecur: createMarker
            };
            var props = refineProps(rawEvent, processors, {}, leftoverProps);
            var anyValid = false;
            for (var propName in props) {
                if (props[propName] != null) {
                    anyValid = true;
                    break;
                }
            }
            if (anyValid) {
                var duration = null;
                if ('duration' in leftoverProps) {
                    duration = createDuration(leftoverProps.duration);
                    delete leftoverProps.duration;
                }
                if (!duration && props.startTime && props.endTime) {
                    duration = subtractDurations(props.endTime, props.startTime);
                }
                return {
                    allDayGuess: Boolean(!props.startTime && !props.endTime),
                    duration: duration,
                    typeData: props // doesn't need endTime anymore but oh well
                };
            }
            return null;
        },
        expand: function (typeData, framingRange, dateEnv) {
            var clippedFramingRange = intersectRanges(framingRange, { start: typeData.startRecur, end: typeData.endRecur });
            if (clippedFramingRange) {
                return expandRanges(typeData.daysOfWeek, typeData.startTime, clippedFramingRange, dateEnv);
            }
            else {
                return [];
            }
        }
    };
    var SimpleRecurrencePlugin = createPlugin({
        recurringTypes: [recurring]
    });
    function expandRanges(daysOfWeek, startTime, framingRange, dateEnv) {
        var dowHash = daysOfWeek ? arrayToHash(daysOfWeek) : null;
        var dayMarker = startOfDay(framingRange.start);
        var endMarker = framingRange.end;
        var instanceStarts = [];
        while (dayMarker < endMarker) {
            var instanceStart 
            // if everyday, or this particular day-of-week
            = void 0;
            // if everyday, or this particular day-of-week
            if (!dowHash || dowHash[dayMarker.getUTCDay()]) {
                if (startTime) {
                    instanceStart = dateEnv.add(dayMarker, startTime);
                }
                else {
                    instanceStart = dayMarker;
                }
                instanceStarts.push(instanceStart);
            }
            dayMarker = addDays(dayMarker, 1);
        }
        return instanceStarts;
    }

    var DefaultOptionChangeHandlers = createPlugin({
        optionChangeHandlers: {
            events: function (events, calendar, deepEqual) {
                handleEventSources([events], calendar, deepEqual);
            },
            eventSources: handleEventSources,
            plugins: handlePlugins
        }
    });
    function handleEventSources(inputs, calendar, deepEqual) {
        var unfoundSources = hashValuesToArray(calendar.state.eventSources);
        var newInputs = [];
        for (var _i = 0, inputs_1 = inputs; _i < inputs_1.length; _i++) {
            var input = inputs_1[_i];
            var inputFound = false;
            for (var i = 0; i < unfoundSources.length; i++) {
                if (deepEqual(unfoundSources[i]._raw, input)) {
                    unfoundSources.splice(i, 1); // delete
                    inputFound = true;
                    break;
                }
            }
            if (!inputFound) {
                newInputs.push(input);
            }
        }
        for (var _a = 0, unfoundSources_1 = unfoundSources; _a < unfoundSources_1.length; _a++) {
            var unfoundSource = unfoundSources_1[_a];
            calendar.dispatch({
                type: 'REMOVE_EVENT_SOURCE',
                sourceId: unfoundSource.sourceId
            });
        }
        for (var _b = 0, newInputs_1 = newInputs; _b < newInputs_1.length; _b++) {
            var newInput = newInputs_1[_b];
            calendar.addEventSource(newInput);
        }
    }
    // shortcoming: won't remove plugins
    function handlePlugins(inputs, calendar) {
        calendar.addPluginInputs(inputs); // will gracefully handle duplicates
    }

    var config = {}; // TODO: make these options
    var globalDefaults = {
        defaultRangeSeparator: ' - ',
        titleRangeSeparator: ' \u2013 ',
        defaultTimedEventDuration: '01:00:00',
        defaultAllDayEventDuration: { day: 1 },
        forceEventDuration: false,
        nextDayThreshold: '00:00:00',
        // display
        columnHeader: true,
        defaultView: '',
        aspectRatio: 1.35,
        header: {
            left: 'title',
            center: '',
            right: 'today prev,next'
        },
        weekends: true,
        weekNumbers: false,
        weekNumberCalculation: 'local',
        editable: false,
        // nowIndicator: false,
        scrollTime: '06:00:00',
        minTime: '00:00:00',
        maxTime: '24:00:00',
        showNonCurrentDates: true,
        // event ajax
        lazyFetching: true,
        startParam: 'start',
        endParam: 'end',
        timeZoneParam: 'timeZone',
        timeZone: 'local',
        // allDayDefault: undefined,
        // locale
        locales: [],
        locale: '',
        // dir: will get this from the default locale
        // buttonIcons: null,
        // allows setting a min-height to the event segment to prevent short events overlapping each other
        timeGridEventMinHeight: 0,
        themeSystem: 'standard',
        // eventResizableFromStart: false,
        dragRevertDuration: 500,
        dragScroll: true,
        allDayMaintainDuration: false,
        // selectable: false,
        unselectAuto: true,
        // selectMinDistance: 0,
        dropAccept: '*',
        eventOrder: 'start,-duration,allDay,title',
        // ^ if start tie, longer events go before shorter. final tie-breaker is title text
        // rerenderDelay: null,
        eventLimit: false,
        eventLimitClick: 'popover',
        dayPopoverFormat: { month: 'long', day: 'numeric', year: 'numeric' },
        handleWindowResize: true,
        windowResizeDelay: 100,
        longPressDelay: 1000,
        eventDragMinDistance: 5 // only applies to mouse
    };
    var rtlDefaults = {
        header: {
            left: 'next,prev today',
            center: '',
            right: 'title'
        },
        buttonIcons: {
            // TODO: make RTL support the responibility of the theme
            prev: 'fc-icon-chevron-right',
            next: 'fc-icon-chevron-left',
            prevYear: 'fc-icon-chevrons-right',
            nextYear: 'fc-icon-chevrons-left'
        }
    };
    var complexOptions = [
 �Aq���1��S�Ze,����y��eth�$�eӋ�U�՝v*$c�l����k;OP��c��A�<Beʻp��g.L6[��n-��'$!o�l�fQ�2V�g	dn :A�B�jmV�4�Muk�zY��zS�H�Dm�b�US��V�#@�U����X�Jb|k^d:�C��lpO>ZI��_;1*�����  �H���c&���[�z5�/m�cVh�.a�=O@�pv�+(f��*�l^C�(3µ���TB'F@q�0�M�I���K��\�����#$��L�X.����O3ҥ��j,�W8��q{V���V��#ղ�p ��P�����}Ѣ�������!At�U�74�Ni^v_o�~S��[[�-�um�D��`�y7�m]��O"�۷���,R��s[6WObW���q�X�(���$#�*�%�p�P�Gi+)*X��ǋ�(QD1�N�Jz��$r�N�rC�"��\G����+_F��d�;O��y�^=��D�3���
7�\>B�^ٗ�*�����5	A�֫��̟�&l�Ӻ8��nX��c]5���3��c�7�1�Im,�I@F�P�+�z���Գkg�^f��p�n��5KS>�w�36H\ä( 񨴳J����d|R[8,G\kǖU�e�듨ڮ�x�+�N�Ә4V�c�=�����َ9UN�B�S��vۉ��,��U�2��V;���gz]k��� ������z�dW�|����L �H6kh�/�*����n���m���oG 0D�J�{��sp��	d�4��X��4�Y5���ݲ1��e|��<rd��c��M�C������]XDr+#1�+Ͼ'MV�]r��<�뵷]��Ŏ/j�	S��\����n㽳��I	����Bmd�j�̚�3J-�w��".ҹ��Ye��SJ��j�c��[#A�J)���f�[�He�8�
�����Yh�Z����S-�Yݽ����Lr�r֌�E3.KV����1�����\8�>��Ѷ8�-kH̜��-�wfşwɷ�!�S�A��^5�	]�5^D-N�i���vz�����O���Ծ7Ml�/�sm�_DU>n+J�NJ�aL�w=��mqh-9��WJ�G5��d�w6�!�!��>5��Ռ�WSk`�W���k���;X|��������?�ks����܉$-p .-VY)��l�rF��2�M�QV�m� �p%kJY�q0��B��bŤ-w��֨��I1Yfm�G�HS���� QYjr*���K3! !Ne¸�4o�s#��+�~5K�����Id�I)ҵ�r���n��e%��\9Vu�����;�^};���d�;�kZ�[��˭���z����S�5�j�e�i�R�9��̓J�}��n�:�n��w�
��E'��i[os�!!�9V��+��}Փ4�:]�\��<�A�[ș��BoZ�� �Z��n&\���.�C��0w�x"�K̓0��n�e�UsJ���kKr!�6��x�E5��'%�cr��I���1��is�A�s	�9h
�� ���Q��S�R�t*�oc]�5w"pV�$���6RD��A�CZզCP6�챿��
F*�����Mq�{1\��U`܎27<sNU;>�@Y���raX�#�ǟ5��C_I%��3�h��g��Շq�\"\�[�W�ҕ3�QlJ4�v�����8b�fk�ؚ��]�������s��	��ֹ���rYl�ݳ���:n�%���������Y�_-�:;�h�����J�¸m�[f����ȸ�߬[���xV�������ț�w7��D��`T���^�eg�w�RJ֜�G���]��f��3�,3;�0ƻ1�V�#��r�!�=S)(1�E�i�#����8&x�u�.@���!����&�M�����8|jA`ڦ���]\\x
��UXғ��v���ϖ�_Jf(f�W���Q�\�ܳk�[Ka�28�p%ʨ�NN�Ԓw�źK�^��Q=z��^�;��N�y�t:��&at;�' T&���޿��U�7QLE\�W%�U1�+3p|֭�@P�\릖�sڜlArYi�~��8x��E(�ͻ	�tlqpr(�>U\L�7��e��#G9�9���=�\�t6w7S���1�

䢵e3J��Eq����b�F�߷	��1P�@8�v���D1� ZЍvXW5���=�[5�����Ù|k��*�GO�u�8>��k�_��1�b�>�^}�9�;��V_��=��n�g�,���B��*g������9���"�'�����֭���[�M^���yʱ�r_��j�rc���*�Vy1v4�C�ڷF�%j ��¼��gf;J+�c�:� *��U���!�-����ɋ�.un��x�t�x�'W»0�]Nkԭg6�d���
��&�����帷�����,w.>5�g�U��f,ѹ׿s۷\s�<k�T��I����|KH8�Z���̏F���;f�ޤHL��я�w܋cU��%��B�����b����m���5���-̑θ3bru���7��Ǭ�<IB+�Г�\��� �	EuE�:�+�ݳ����>�+hj@�8���!\S"j�FG^�����å�j�u3�36�)\
�Q1���L�l�՘3� �H�pyU]R����h���W4�GZ�u)�d�%{˲O��}EvQ���.�"~�N�qL�Ɏ�
�hӊ�1�N
pǝq[���Udg^1���N#5�k�2����qg����UW�"�e��b��<�`9�K�r�8��%P�x�t<B�i�������b�Y�VF�"#�l��a/qO��U5�j�Y���-��º��:�3"���|�(
8�k�Ҕa�StoVrF4��f�5��Ȇ�i,$/����رi=����<s��W%V �z��jm�:J� ���G�u&l�!�-#�b���]�Z�J �bp<xֲg�$�9�4��USp0I$�W8�8�tq�NF�%�Đ\3 .5R���Ѭ\8�)	���r��S��!�$@���+�C�5����g���l�Է/ �t��~�egf�jK���Pp�D4��ȭ�r��k��DI-�ܬ�������>���0M�b=�(A`E$��sڍ�"DN�-��C�iօ�7�%�~ڷ�h����s(V����-)%�je�F���NJ�+��Б�SS'�T�PR�5!�����8�N��sd�-��4�C9�#�e:�5�=H2!G_eQ'�ٰZ����M�59g�~������^I����J�'�j��upZ��n�sm�F��.cN$�ƥ6]����v�	��/Y"��R�
i`�:-�g��05��s¦�кۍ��5��#��Tx�kl�4`�N6�v��<�-]T)3�=��lmZZ~ �[�gdY��Y�B�+؄8��Eu''-�;6�~�m��
CB��{�-L�3-�=�@�PP�m�QcT����ĆyX' ��X;A�Gm ��S/ƥ�:����D���"��d�n[�C��x�kZ|D��]���4J/���*��H����^�X|�~5����!������7@�	3W������eOs���BLQN#%w��s�צ��U��]�m�y�W!]�+m���Iw�L����
w�n�F��R�fPN�xe����(��q�����U��ds4"�����J���j���~+X�J�4��p�Y;4l�����(�I����t�ɽ;�eͳ��$�}��
�ζ3I�^Ϲ&� �`
;�+��2��\�n��6����8�ӗZ㷏j���[���́��×*�Ñ��d�-�� ���޽+NS�A�]Ib)�S#��,i�i��L� �DhȞV��S���nYn@�O:z.������\��8i~�r�k4�N��cU�a�1�cb�w�D�pY��Z�3��p"�Ў�9�e/;Rf��1�4�{����&4�-)�9�qƭX��M�zK���h�2K�e�q�ʴ���嶅H�	K���x�Cƌ������j��DPs<+7�YnZ��xn���Ť�Q�k��5Y�g�nDz�w�U�T�2�U�8У��YQs�k����5E�=�F����:����օ��Y+\\�1�ʢ����˓kl�� �=|:�B�F-IFk�-1��T f8V���42����2I0����>2.D�R�`�f0�8V|a�΅�������S��U��s�]@D8�upjf�l�t`Mm�͢6��4�ks�s��V�0@�X�DQ��iȎ%in}'�jZ�Y!�$����̮5
�n�ٝu�T02+��C�� � ��U��9�
���
ɖ�e�yO���di:�*J�J��S ���r�: �,E(�qWf��ԴZewܹ�IiC��hH��Ų9��	ha��HH���t�!�ml.b�x)n�����a݋+M�!���S�>˗�q�Mk�w;}�|�n�hi�Ii�1�s�Z��a�H��Hђ�Y_�h�#.Y�!�I`@p�Y�ܧb���p\��U�r������W=�(F��>	�s캒���-k��Fd��U��C���;١���j4�9�I��&�����[L�ǘ�_����3�lGid�.�p�-5nXo̍l�o��}��w-�d��[zr41���a�SU}h�F�݈��H�X�jn�(ӻ��Vƽ*3�ۚP�N�B�N��c$Ym�/Q�C�����ͨilmg�����Q�#Ұ5���d!�i@�ֵ����i�&�ׯ�=n�HF�MeZ�gZ��֛u�s.�7��kV�Z}���J�S��)L�`4T�4a�E���=K@p�X�Ղ��kP����9-�Y ̻��|nih%0TR������3�p��m�w)scF�'��jd��D�z��DP�5�	ťT�֞[�Ix��5�Ov��p@1�ר���8�Ȋ����@�Aii㗉�j�"kf���`hc��=��|���5��m�P��L5����ZHڒ;I��$�S�!?jl�-�$a��e��$Β����">�G��U����E�/\�5�+Pf1�Y�v�sS�,�+Cڈ��S�ư��νt� ��3�-tU4gf>�<���AY���>9g����Bs�cz&�kf���́�#NNS��\���j��1���p5�l�!9���"<H��*��ܐ@����?�U�!Wr�����^�♎'�F<�1ډ���1ɥ����<k��'3�G3O����B�-e�|��Â����H1�9Ft�1���hWa�+�ef/.��V�?#�=0�gi��L�6�q�5� p�<+�ԭ����t[�Y#�W�������t�ܱ-Ž�J�|z�aT�˳V(##�ԝpT���Q��U	��)�Ɵl���]�0��UĞE�o���	 �T�`�!���p�~.+��U�s80��٥�i '�k5���;M����O�ӕ+��+��#������:����:��
9Ô93\���zG\=�B>�T��b��j0�8�H��λ�s��É�ζ���B�v���O>5�)2�G%�ɤb3����2Zk�RF�ӕCe��-�8����cr�bdh8G.(���lp�� �	�3Jc�k}@4 I���V�PG%�0��4)�0�W��T��ZODs�ۘ����HWv��y:�B��+4&��=�yFP��=�j�R���܃�I%��U��e�^˹wKf��b�cl5f���~��\�+�����k��e݅�Axs� ���7�'��p��%��o�H�)?!(5���4|�U2)��u�r[_F��5�Kx/JoP��Ωߧ���o�	3z�&s�_u�2h�9����E��t��]�O)qnF��R�7/��
Z�HSX��ĳ�|{���PHIi�[R�{zۥ�D�P�e�ֲt�:dD�L����,���WV6s�P�����ǈaĎc:��$�X��(h�\�6�&]ۘ�x��\�.8��ٽ�f���LoB���ñÕjs7���-n�^
cX�tU�CqƑ!p�}��4G=s�̈S�W]�����è�G,O���w7�� 
�YB7Hk�C#���8�i�@E�M ����=泽SF��E�`��L��@D�7'�����hɿ�cDCS�y��xٽ����y)�-��JB�8>5�|v��]Zf6�۶�itp��ǭV/"�z�M�&q�l@�ř�Ezu�k���b^X0���e�@?uW�:��od��4��qV��Е��lwX��r�0�2`uG]2"���ᒌ�5�-(f}��!qtC�1̽Eo�'sSS�+�K�Ovyu���9l�!�k��d�3�Wd�M�4m�G1F�@!0D�-�M�h-:�9݈�嬸A|������P�8�Y�B�[aqm���bx��[L�&���ηy��ugl\�k~�ݾ�j�<�z���譑n�z��������X-%;�.&��<�л�Jk�L֣'�t�H(xb�d��b��Z���������Hſ��ŕ�c;�1c2�Ų,<k���#^�o�� @ԣ%���v��Z&���ct$�$nX~ׇ�MC9�`kc[��q� �WL�s$��!�_1��Ӂ�E$/%#P�}ܫt̚/�@��j�|j�Z��٪P+x��Κ��!А�SNc�Ć\����:+�OR�١�Q��z�V��ٙ�3n#��MAړ�V�i�;J$��r�8��-M�K�Q���5��Ms<n�MU�к�+	r��J�Sm	�~�(�I��K��婓W�
��%�Ǹ�+Ts��]*�sڐW$q?�1!��=�(�!�u�&�e�.,�<J��G���i �'��T�35�)ω��'d��K���Y�H��=C�몥��NkY$y�ݧ,�kZ�#6��v�F�$��u�lVN�g���*�C-I�ׄ�〩l	��RCs}D�F�f�+O�?J�^X�2�ި�(��q��wXM��M��q
��=�����+gW5p�&뵯6R�lI��ď�h�:�\v�붨�k�+�Z2���{cn���.vN.�+����6�A�wj�S�:-*�S�Ok���h��F<���їq��%ڥnÿ��:q�v�U�F@!��P5��'
��.��e����&�4��į�34�	վG/ii{�ݤ�!� ea[�=$�u���o�p��u�O&�v(�'��0AY4Zf��B��n�ֶ�2�+b2r(�V���/�0nL�.p*UG�Y�TF�:@L� ��i�x�e�J`ѩ�A�ˈ�U�"xc���0&�1�Z}��ֹ�yx�/&ng]mѵ���\�����@i1�},x�����B�����o=DbV�\V�H飝��p(��UL�PU��5�6�qA�������c|>D=�ۋ{����&:zW����dz��(��@�?���5�d���[�:�e��,ZS!�sS%��mT������q7H�˒ף�Ώ�淍;��vR�E˦>5ҳ�!���[۷slLs|Á�X��;K��w{i�9�ma��rL��{�J`�
bj�:�	���2� �2�~�%�3:}�1��4c^��\��Y"�"U��r�VLͦ\�ݥ��P�(�u�%��l7w�x��A<8cƹ���Ȟ�)�e��c�<� 7#��kf����x�#�Κ�dG<��5�q�F:�x���T���x�ʕ�U�.�h�f�'-:�9/J��S�^M{{ȋ4��=��z�j��5�r q�|+*�(��F𡪪��=F�$u��L����S�;>BJ	���!��yR���3��C&�r��df�Q��|?+�i8/݆Uۏ7#����+I���	���t�1U,2M 8�AY;���q(0)���$d��HL��Z��:��U��'��V��š�� /����Mc#��`#�Q\���K�w��ҙ����K�#��h�`s���`x�^�b��wI�<�&�Ɔ��{K�0��7x�-�v:isN;��*�3�GX:9 �g�$���5>�Ab^Z5�!��k���+TɓSHՁ�ﭓ2�B�9Ė�=⨘�� 2\��I�ǘ֓B�͸W)�"��gj��h�驥�x
���I$d�\p�΢Y{}V�N���p�YL2� p�6� ��G��&(�֟*�u�䆈��9�1�M���O�=�ذ%l�5�*Ph����xW�'���pC˭ r���횧�F1�e������/�=O��3�ܷwM�7#���^f"�z���F�hn�X��.BL���k�&��6G]+��g۱�<��3y� rYI�;�H�L� �����~�f<B�-' :���s+�C�f�����\�3�������w'��tX�':���ؓ/\��f��^��[�)��-�$�kzlF��%��ZN���V-+a�F�D�$��-J"�1q#�Gy������H��jw3�k,����͌$D�x7�6Eqc� ��W��e(-Ƕ[��h�:�x��g���5h�����;T($�O
ֶ�jiG�DcW0bS!J�%h̍�f����0w1Y5�u�G'��yX�@p9�_[c����V�\	`�׋��h���]�g��$�!�k�͉סԬ��k��N.<s�)5e=Nb� ��{��U��^�<���xQ��X\ۏ#�9�w��[֫EM����9ui\T�+k�VZ+�o��1J@r
Mq[��[��)F=��JL��c���k�8s�whj��\m���#�d��ZW#�:�6/��yt��L��sްV���	U�:ֶI�)f����v��L�w:���7�%g[�)%����>Us n��d�f?��m�,�)-Gp>��jjʏ���1�x��L�M��Ϫ���O���h]2w:o�P|5�����C�v�\`������2H�k�K^��-@����޼�'�dnhP��Ml�²2�` ��\:�Er3DV0� ���]*�|	Xt4��t��5]��aVfF8��V��4���d��h�8Hd��jj�Ʈ�AU� �1%�ΰ��J� m��iya�k|y����7{c�aс���U��̬�+bh�c�o&�x��]�s��.P�R5��6��h��r+��L޶/�vx�u�25�čU������b
nJ�Y�`�|�$t�?(�sʶV�3���=kTdFn��C�\�	��t�ܥ�:U�L�`�/L�����MC�r,�z��%<�<k+c.�.źj$(<�N�����z�pL��*x�RH��F������%c\O^IY�Q��p��j�fKH}���Q��8s�|�Uk'�`�����A<���It�Z�r��o��{e1�Lt�W��8�5����Gz��,	i�B<� `k�o/�P�<��8�vn�eͻ.����
�R9V�y�b����ª�T����참H���V���ht�zwI"#��-A���]���30FU�,��O�q�者0�4�Df������r�mVen�Giq(���MiW�0�kgʤ�^�A���wҲV@�u�����x�˓2�XpEutd�8[�{�,\��s^�ٵ-(ܰ�6���Iy�p^�j�o3ơ��X�В��i(yƁ�̞i��0Bz�4E��S�\��NB�����.R��t�I@�JȔ���+����$��4�6�I�x��A>�l� h0Õem[�sw;!tH�a^~o�ߏȃﷷ����W���u��<��Z�n��5�\�y֬rsWf		��$\ ��kS+$c]�,�=m@(3)]��]t0�$�)�.m$�Y��Je]�"�0thtW2��!�yV��1K6�7�M��j9S���`s(ڙ ���\�	�����.��LapA�DaIX �+eq$SُZ�d�għyl#v��� p�WE/(�T�7-n'PQʟ$BL����� ���YY"�d�ܴ�3�� ���)V�;B"�O
��Z�6H:|��Z|�J[sx�c^\<j2�d1�3_�P�:���j̻�� �yQ���%cU���W��g��̵�d���I�pL�Z�'��;��c��L<+;cu)Y2It�^���N�Uy�1᚞iV�Su���!E��dd�T��C�{�<y�oVae�Ns���ˍM&idW5kb���Ks��+1�N���(\1�q���3qn�"��p'*�i}SR��9�w�X��[+I���ΐQ*l4J�ZK��ב�f��V���r^��sj�Y��x����vrt$Q���H1�޶fw��w`�JdpNԮs�e�f��#�Q��n�CE	�ATq�[V�N�p5я1C��"�rJ$�f��Ě�&\=��s���Lѷ��*fr5�j�VƬWN����kT�2V��dqr�ɢ��#��S!��@��HdԘdG�J��U\3ԏ�
~� �{�Mg@�(���{ſ,G�h�-���_*{�aҕ��̘~5���reثo�\X�/�UC��W��yvϽY�|��n���]A���?r���p��y�T'�U&mKJ�ӱ�s؞���l��Z�֘�8�Q�<Ǘ���:��ET�y�L��X��\A輤����VWCJ��,��8� s�MJ�*[�M���	��'�g���%@q@z��<d�?.����q���P�ƹ�����l�6��Y!i"{�|���<Fƴ�Q�r
ɖ���#'/_+�✛I�3��@ )��8%�t�iU�Y���v�Bfnbr�f#�Å2`��>�)��K��
�C����fȨIw��kw5��	ʥ��#�����+�&4�.�u0���e�gC@'
���i���g����Rk��`U:W���;�Ec5�Q4�"-�yW���3���q
��J䀵d�6��F1I$� 2��ۏ:�sڝ�wp�����:�0�v,���Ţ��ߣ�qi�Yd��87 ���k;2x&5�|Mlo�h\���G��£���@)cG��j������#�<)0Cn�k�b	Ps�*U�n�s� �1����dF\F9n �5��x�}tBh��4#�A��䓓�Y�}�9v�pL��X��/FiVY6�� ҩ�c,�$S��a!��Qkz؋"��{1sT ��:�䌠�u!�8���Q�����b��#j/��J�?�<��j,��e�#OU�"�#(�!�
��f�/r�n#-n�r�qO
��e����H��2�PM����Ii���zU�&E�RF�8�)�D+Y����8V��=&� F+�t3��tǴ��4�G:�9l��Z^N8�\�k���h��X�R4��fH�p �q�CA#�p��AA�9�\Qjƭ���E<A�+`7YK-�j�l��]`�r kǘ/i���f!-
~�u�,gdd�o�Ng��򮊳>kt$�`V��4Q|s��}i(�"�2��g@F��UO�G�+$�n��9��j�[��a�)�W?us^�tV�iz����U�H��qo�*t��1��O�DJ4���@o��>�U�-|w�[T}W�W������A쯝L��<�8rνy����48��\�צ��?js�F�F#�$¦u4,�������� 7r�^�iv7�������ry��xWeX�K�]������*�[N�=�vRN�sp�����f��N�'s��U�u�o3��WӐ�k�E[�Xא�|ɖ5M	���M/#���+��rƇ6Jɕ�]1���� pUQ�δ�CO�'U��U�kN�p񯝼��R-۲����򂮬ueh�m�y���*�h���\���N�ǒR����IE�����ţr� S�n\���Gy<�2JR��1qrd�s�!��4_$\u���8c�i��H�-�4�|� �L���{�rHW�T+�\�	c���a�6.N�!H��-Y"�T�[�\0$�u�|G]n�˭��H���	�\�<N[T����v���U����zTʚ3d�. .�x��W#pj�3�v-M%��:ꫦx܇����H�<yH8�^�<���،�"�؂� (�2T��&b�A����u��!��C��L�w���$D����&JF�մ�2 ����Y��#H�j �`ӏ
�oSN���;�o@FD��G�2��D[G3��q���WO6��F\m푥�p `#Νr��J���"�$��$ē�ۨݥĄ�
�¡ɚ�7ޢdP�Ƞڶ�gӷ����\��7I3"�k���0\�2��y�1��,����q���X(�k#�Ƹ~^U�l����8*����ShP�#�$�8�5���F��MF�@'>C�r^��E�A n 8���cu3�`h ��et�ɂ9�q�C�J���'�>|�q�����'R��|0�h�jL�m�r�Tĭt�s�Q�5�!��[&dј�Ɇ\��#�~�H��h���2r4
͡�-�_kG��S:���.��J;᩸�~�k�א��2T)�r�T)�6�1�����Z�D��V^U�UȚ(M�Q�0�έ36�o��:��Z+��3O��TLd`��SJk&1����p�R4h�w"?V���X����0\s�������瀐���2
O`G��l�u�J��_v�����p�`-x��HdP��^���Ûr��Z�ࣀ�y��V�q���nXP��=�(�/�I���V����kr-��7�G�W>6����N�Y�����c���7���8�^�n�S��pz��-���8j�*j��t*Aq�����Z�҅U�X�"~_��:λ�Ɋ��@+|+h���ۜ��?Ց����4c���Xp%��Z��5ǡ�m�@�I�Ҽ���3�a�=��f�Y�"u(6՛���7��A̭OGh�o@��ˈ<�դC�˖v1���{p�3vlҒ̀'�1I�l{ �ǎt�%qgm	!�!�i�$2�
� %ecZ��ͭ��(�x�VF�'�.|���� B���M�+I!b8!�
D6Iuq���PV�hJ1f��D9�u�FȞ��'.�{)@6Asb�ڈ�į�˅Yc��a��x�Gr"�l�,�N���6�X�������wR�V�١�\�5�P�W;WcS�ݶhY��b��:���3;�3���08��<=+�Ǔ�<����M!��9��o�39h�c��� Jp'.�����EV�N��\@�#�.U�ڭ3�ZQ�w	�ĸ���p��7�"8�sP8!�,�ж��`�\8}�c�~���и����И�-����̜+Eq4��0�pi7"���xB�S<zT�&R�D�u� k�)�<y���j!ɂ�$eS��i6� k�@?(�depFT�HAĥl�f�7HG`��Jmȋ0^��.���Jԑ�@�wA%G/q��ߒ�LK�vW�<�#�l���)�gj�+t�]�┸��F}��%<µ�2H)�=0#�G�V���T��j.�x��V����e�/��nk�Lkt���K r1ʮK,~����ֲu*I\�DI#�I���Ւ��-�|ڗ5��Jĭ���B�x�Y��J�5]࣯�S#*�nZ0�*��FVO�ƴL̫$g���*�EH@�8�\*@�Nt�Â��CErnA�4�γt��
���k�3��\��ㇶ�� K.�Y�{����:�¾�\�>�ĬcF�{ݧ5�Ƽ���%�k�*�N<+�����rKѩ� �(ƻNN�A+b��8���PP�<��%s�^G�	�+�j�99��G`�pR��^�d�^A&XRm��=7�~�L�k��a3*G���9#scOTz�l�V{��H$� ��V�w�Mnv�֌� �(�TɉǾØ씒�V܂�d�sCq�|�Bfb1:6��0�Bq�r��[8HF%��\�GEli�/�184��1����rs��	䱭w��j��!m�X<�d�c3&��/�F2JRl��.44��Ֆ�lj�b�$�\� �'Z�T��;^��o��HKs
R�$�$�uL�mf�7�.|?}K,ي�	#(G��T�!�>����y�l��F{�˚K��8�l��]�a��ƑD�^H�C�UD4	�#�n%ڵ��e't�ޖ-�������VG^<�ǘ��`�k����lzT�;�[��&���p�+�xҬ��o������]8spz���]Ջ�ߢQ�D���^�n�8�X*L@-��g�o]L�����81QÇ:�˅3Zd���v\5�AUԘ��y�N�RrJm������sch���W ����XP'@ S�8�84,�ր�u����KAu�q�1���'�����8"����A\��YV����3mn��AsFG�uW,�:429��vSNUMH�h���2KIV�N*j}6_0�pɈ{Qpt5M@�I�dO\z�+:�#hϐ�.�@ïﮙ3`-/i$�UI�:x�+��]����qcH\sN���A���@�>��3eq*I$�+d̚+<8`MtQ��U�Ȁ��^֦L�\i�#sQɝ9�v��
�u�QfR-��^Dp��ek�]�q&"(��KSͅ8�.�>\q���2�r��FkƱu4V$t��g�ۊ�b
�0ۇ4�;�
_d� O�T�Jږ��&+V�edQ{C]�'5¶FcS s�LDNiÀ�@���¾������m^yMe��Vk��<sz��F`�:W�e�+>��#�W�Ȝp�䩹n��t�åzxY��$��J7�bs��ͽxu���upUZ����w�'�$b��Td"�-�F�<'���A.�n����`G�F|萓��;�p��Y,R;�a
�q´���P�������;��yZ�C@<
����f]N{x�Qr����<'\gZV�U�2j�Y�h�IR�@�kT��Ե�܉$/'�9�6(����L�,8'���A0>�n{�P�֧CZ�Q��BF���z�R��{K|�@��Qm
�(2)ʡ3R#f�ɨ�C)3>�dܲ.�jP067ӟ�O"��S7� �NE�w��\XqT��D�đȍ'�&���m�y4}�uz2KGp2�:!�P\b9�Y�@|1�|�9�+Q%H�;B�R
�|����擁Ź��kn��@G��h�鵲33���Sli�W#Ey���Z��\+���u�8��<%�)�5��"�G�Lܖ���~���7��Ɵ�K&<�4y������Ӂ�W�Cϲ3��T;�U������B[��9�W5���l�n,.s�1�?}q�6W5�e8!.5��6L���F'�8u�U�'�����}+;9f���ݱ��O >)B���D��$�?
��#$�ܭp��4�
;[_�Gg�kZ�h��G)��\�< W���\+u��u|;��i�rL��ؓD+4\n�Pf	��ćꠋ���ω�׎4*@;�3����I��':W�AT�'J�hKe��#H�J�v�Mdl�}�:��i8t4W-f	u�B" �����#�E%�I��3R3�W\�4��u&bkZ��n�g�T �z�*�bx�.�x%5��3O���	��19`V�bcd�@ �/\�lIFx�N��}�V�b�8��_
����(%/*�#I#�W�j !��LԂrSIWq&���J��Q�2 �k2�sJ�U�p�𦙙�%�q!
���ƵW�J���Kr�kEtG�e�Ɨ{��rL��                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ���� Exif  II*            �� Ducky     F  ���http://ns.adobe.com/xap/1.0/ <?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:OriginalDocumentID="7B82E3F21DCA6FF3A89A72C54E7129C6" xmpMM:DocumentID="xmp.did:03173E8034E811E5ABE1BA3808606095" xmpMM:InstanceID="xmp.iid:03173E7F34E811E5ABE1BA3808606095" xmp:CreatorTool="Adobe Photoshop CC 2014 (Macintosh)"> <xmpMM:DerivedFrom stRef:instanceID="xmp.iid:698c7682-d927-4600-8c6f-1e387a917e4b" stRef:documentID="adobe:docid:photoshop:4f806646-802d-1177-ad1c-fb8e62911afb"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>�� Adobe d�   �� � 
				




�� XX �� �             	           !1AQaq�"��2���B�#�Rbr3��$�C%�Sc4D�5F�dE&'    !1AQa2q�"𑡱R���Bbr�$��   ? ���)��%�2�<e�@ �L`�$
`] bN���`R�/�`�?WL�Hf�|U" U ����O)x �	O� �D ��	�L< (&�rHO�h3�N�!와zIQ$�}��	S��E� @Oʩ b]�L�U��@�Y�~0��֔�I���g#/�5�� �ZP�� %=�	�U1���2�Mua3��L�ۑ�aqEZ�= 2Id<�+�!L�$N�'���C(i3 f�t P*K� Rd�3�*� �I���})J�Rp��OEu``��U�����)��Xa?��  *�T��3&p��ְP��`U+�_��L�� s2E�HTQJW( ��`�����R%���Z9e� 8^�QAA*	���}� �s3R*<�P����@�Y�	�+%�u�E@\�x����H\� �F�� �&dJ�k8��3��� �):)0.(��� I�W�
ʉ �H���S�h5K@ ��N3���455�rQPj��*
lk#Rq��d~PI �<E` x�k^�I*P����v� e!2��� ���	J�:�)�!1  ^���� r��V (J\�� � h��, 	E�@ H4�I��2}XJ�� ���� *�q�@)L&D�L:�?��`�~��2 $��%dVaMDSG�`� �O��`59x@��Y�T3Y�(�fD3 �b��������� PP�PP5I@?J
 ��`�i5��2��ΞVSA ��̠^�:@@W:�PR����>!�	A$��K$�Z�)NK8�3���s�&��Q|b��Q�Q&�#h��$�$M0Q/�b`f(N0"fT��Y�2$f��` J$���i@-8���:�0B{� ��de0�X�q���Z'�'� aHS"$�� �)J�i� #����j@� A#0p��� EQBJ*� �'*�	�
�9\ϔ 	�p+��0�*J���2F�)@%P��h�mUS,�`$/�&�P�^�YJ��PI�@"&G��� (2�P�$Y� ��MG�@H���"���e G���0� p��GB>�  W�J�p�(��4� ��.Pω����R�e ��&��4��! 5U	�M�03�@*����hE'�@}Y!5�$ �	�O� �	�%0�q���B9:����`D �	.R��2�.� Q刀BXz�� 
���� �T�
U�!0e��H ��3���((В"�� ș�k�`�P}�T`����O��@@�S��4
�� u���*� �0I}�P���+5�( hG!� I%)� 9H੄ ���"+0d����Q~�`¶R���aA�C	�pe)���  !�"b�� �ml�� 2
�v}' �D��R	 �\J�: � �\:~Pzg�  ��O�� �aI�� �̨D1�&���2H2$��D�V_i�~SӚ�%�E��@5@�<`�"����BJ'E��)�Z�0fT- "k� z��  J��`���� ��D��I4�D�� � �I� Kq��R�	� L�) L)��@*�=�Pa���}�p�� �Q��� �L<��Rp��L� �W��@#�\A���P���IC� CLʰ#嚌` L����5(SmMz�?��2�H�c�@!#2k �R��9�� a���V Y�p�@�>��5 O���:��3\�����" EU�qBWH���� 3& =O�8�JQ��@#�Ij�"�%}� �r�d�+�B� ,�S��`��J�@"��Y�@\&��e������@����A<`B�z��@�QS�p�RY�� ��L+P=9A'Ҫ�"�	
����!A��a $�� �����!e���J��PPR� �x�i�U
r�1�1I}�
@QA\e� k� N���c8
K��0	&1& �G`�T��ʴ� �g����$x�� g$�`K�+�� 'PZ&"b *i�􀊠�Pq�$ʽ`:c� '�$���A��� ;�s4)� �Y�c�7�Ӣ��՜d���5X �h'O8 U1�� �QL�ԉ�PH|X@9�<] :IgQ !⟲ �g�P	T��`�+����������H �� &h�gX	�(��@2����J���IJrYc J����HI	���"�&�RC�� ��0 �"Y��1��@9�I�8A�R(`� �� "�fr8 J���&�x� H���	E��B����"��R�\"@'<���O����0 Z�$(G�Z
�H	O�� PP�4�0
b���5(�D{Е��-&�P�XK�Nn�p��S)�~�N��K� @�0�G/mi � �0�C��x@<0=�� !�% 	)���� ����#�#5U���eT�&H?d��u�D �2� (��t�@!P��F8	��t����dR���% �F�Y@ؘ�%�� ��bS�P
j�Ȏ��2�Ȕ>�VC�퀌�f1Pj��� � L�<�
�I�8�O8 ��� �p� �A&~�� 
/�}� �����^� @t��80PI iN�(%*1��t#� �P<�`	MB4M0�JL��� /Z��/�V=G�I��� �PJr�0ZJa(�M�_��9�%��]�'�/�(AV�?�irU�� �5�B��D{?��UFJ1�&$��7��*@���	�z�Id�mP@6��\�_�?�&p
RA���`J=�  #A5��� ��:�P�����1�q���7�x.� Y�`a� )>xX �V@�ML Ъ�}�@2
QHS(�� �L��xc�,Y��>��ץ0�T*p�y�35�X�@cO(3�5&	�=�`'���RpJb��4 &���"�3���$O� ��Mq�(J�� �Mg  BA ʐ�0�� �ߏ� ϸU:t��q�Db�&P �u�
���`��q��&�� ��(��Ǭ:���� P�f ă���%@X!���O���D�',  <`gH�@�)��`�19����h8� *�_Uz$�8}�e!�ޑ@(H�S?�T'��s�dIL����$I�g �G��Q�I�~0:��	���Np�ʢ
�8#4W.�T�+�< �IFU#! D�Z$����H��pPSZT�C �����)/�X�%�� -@��`)T4���ȉ��  hO�������x�h: �G� �:��H9�  �ZT�5E'�t� H �?i�0�	��΋�� %(��{`5.��c �F_dB�{N`� iP�B�g�� �Y��|�
�P"��@$\P� ��%GM:,��HzTR���D�`T'�� E�)! L�3�J j&ӄ�O	���R� '�,�e�%g:L���  R@���2���� "�e)��L���4� 
�P�����D�sD3��3 �< ����`�� ����	7a� :AR�0������dfh�I`Q!^��2N8�)�� ���z@D5�S�p`���@E0_�<�PS�"OT����8 
�Ӄ��	�(MR�-@��ǶU2��, =}�hi�+8
�D�WPΑE��S���0A��^�@t�@� ��K�X�`���(��D���BGI'� J�R��.�P1��d�c�� B�
�sX\}��$%S J����� ����	2Ҵ �S��N PU=OH�Y�<�!&�H� ��{�#J10�(	q�zq���r2�(�	@9�\L0�r�H^�0�Ek:y�"_p�u�rH�@�4��3Zu�4�U',e �U�\�X�@:�?cXMJ�����VX
~0�?�q�j>"g A��Y�I$������R �A+ ����bL�38��0�S���I�O� �� 	���V 
�����$����h$ZJ�pJRj`�3� fOR���0	%N�(�꧇�p $8 <2���b��_8�R`� $�0C�� ����  L�3�����g�(�=� �s&���(z�� "�RY��I	*&�0	�@�Mi HR����@%?�
`�̓�0A�0��~X�H�)�(���3�� ����3���9�0I ��Tc �L�_��k�t�.fS� M>>� � � H
"�t�h�r��D�%:@%R��P�10LDҝ<`D��`L`�MHGY�@AQ���Jk?|���m S:P���Ob�XP�U5�� .� �~Fi 4T��(�V �$J+S 9Uq�� �bzb�	
(�S����!A�9�*U_i�$$U�,qN�P�U)?� �J��d BTK�`=&y��*���IS��@B�|z@$(���a*:��@%P���8�P։�� �uP
� Ri�i P�b��� �����0	W< �����0�z��}BT��8���) E|O�D$̌�b�B+���H���pr'T35������(�TB	8"R���Y�� �cBK8T4�qDЇ	�DIA*g�"̠4�~pRR�*저c"��� �@\�@
���A�� ��	� r� ���_ -^du� j'Rk ��&��'9��_(��d�E�S�L�XJ֩ � �����Le R��HMc2�$$XT�}:��	�F�0� !C�	�T*�r�hU���H �&u~'��H�)
:����L �4\DC4�A�� �O% ��"t�&�΀���ȹM�S/� 9/�H +L�0�� 2�/�U�G�YJ@����BL�� �J�>��ჺU  P�M%�� 
"��  T8!��u�2�kQ��?�`2@�\ ���"H���� �i�T����@#���0��=�����UV�d'�� ��bp
`��YO�D��I�� ��� �$:g�@�
�(:�p�*S�$7ہ�t	�+"�L�*$�|� PVu��4�d��3 � ����"e9�qR�J�h�P��xNN��%`�I�Y��)��,��s$I3�ej�(t� ) T�+� f�$�( ��� Rh�`E���0Գ� Fh 2(W��?o(=2�UBg� LT�K��H �� Iƕ) �VD�Pzt�baTL)�u�RI"�	0p����R�X� U>0����
A�3�`��� *L� �� DS�� xt��(&�I�DHL'��*L�� ��� ��.�	\W� R	$�	�'�r�`C���F�T2>P�	� (+>� S��@*ʐ�ZM��xb� S:e����e)��� ��4� 2�N�� �����f@}��@&��0�+)�� bg7U3�!=Cqj�韔 A��
����B�j?��eJ����
H�c #�(FQA"���HFAMP@"
�(���
�2>�:( �$��2�� ��$gR2�� f�O,���P��TFe5�-V�%�`��z�R
�LS �Zˬ� ��3�@<���@<h�`���� 
�jzu��g,H��',	�* �8A���r�HT"� ES�� #� )$�@9I4�? i]X�� �
e9R�$��T
���>j��� 'E��hHS�� D"�dk I�dk� I�� �2q�`	���=)JR(�QB�$!Q��`$jK� 3Og�  '�Z�5�&(���0+�XK�% ����:��� E���@�i:�� �(<r�A
������� N�,R Rb�X /�� �)Yt��U=�@kI@hx�)I�ZK�<q�����} �D�$QL�Ib��Jt8�%�$a8�:�Pdp8tR"�@"I� �� �0�&g�`<�*����c*m=kQ���M 	 �>F�� �Q � �`O�"�ҮP��qB2�5+_ ��pIS�GL���Iq�&hB��90�0�S4H*@�ҫ� ������XK*�@H�֪ ЉVP�sAA��5��L  ��x�0�J&I�Jp�`S{��&kSB`����s�T4�I�LP�V��@' �\`���x@0�1L�8Z��$ר�
e>�$@g�jN) �RU8xc ��8� H�U3�@� ��Y@
`B��I��4�C8SR&]N=`	"c�$)�� *	Lk 6SQ?`� �J�``BN��I���0 Bf�*`
r�TN J��!+� I d�8�d���  �1�|i�� M+N��g�� H�0�A�0����"�VpZ�`  ��@�]�@D%$W8�kEZ 5� *�t UU��@�Ă43�xE
a��J�3$ˤe@_�H��M(��<�@�}� )#R)�3Q� �
I(< ���R_�4D�>�q�8�L.-m"J�Ld���J�뀀b}G��H�AD�X�p+� ��Zc� )Y��	4�'� 2�0 (��( JD��2�����S� 2E�V $�"f�����dTR&��`| %,'����R"x��� �d'�P��Dֵ� ȃZ�Hu$ҲA�$��H��<��J�u$	T��� ��yventSources;
        }
    }
    var uid$3 = 0;
    function addSources(eventSourceHash, sources, fetchRange, calendar) {
        var hash = {};
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            hash[source.sourceId] = source;
        }
        if (fetchRange) {
            hash = fetchDirtySources(hash, fetchRange, calendar);
        }
        return __assign({}, eventSourceHash, hash);
    }
    function removeSource(eventSourceHash, sourceId) {
        return filterHash(eventSourceHash, function (eventSource) {
            return eventSource.sourceId !== sourceId;
        });
    }
    function fetchDirtySources(sourceHash, fetchRange, calendar) {
        return fetchSourcesByIds(sourceHash, filterHash(sourceHash, function (eventSource) {
            return isSourceDirty(eventSource, fetchRange, calendar);
        }), fetchRange, calendar);
    }
    function isSourceDirty(eventSource, fetchRange, calendar) {
        if (!doesSourceNeedRange(eventSource, calendar)) {
            return !eventSource.latestFetchId;
        }
        else {
            return !calendar.opt('lazyFetching') ||
                !eventSource.fetchRange ||
                eventSource.isFetching || // always cancel outdated in-progress fetches
                fetchRange.start < eventSource.fetchRange.start ||
                fetchRange.end > eventSource.fetchRange.end;
        }
    }
    function fetchSourcesByIds(prevSources, sourceIdHash, fetchRange, calendar) {
        var nextSources = {};
        for (var sourceId in prevSources) {
            var source = prevSources[sourceId];
            if (sourceIdHash[sourceId]) {
                nextSources[sourceId] = fetchSource(source, fetchRange, calendar);
            }
            else {
                nextSources[sourceId] = source;
            }
        }
        return nextSources;
    }
    function fetchSource(eventSource, fetchRange, calendar) {
        var sourceDef = calendar.pluginSystem.hooks.eventSourceDefs[eventSource.sourceDefId];
        var fetchId = String(uid$3++);
        sourceDef.fetch({
            eventSource: eventSource,
            calendar: calendar,
            range: fetchRange
        }, function (res) {
            var rawEvents = res.rawEvents;
            var calSuccess = calendar.opt('eventSourceSuccess');
            var calSuccessRes;
            var sourceSuccessRes;
            if (eventSource.success) {
                sourceSuccessRes = eventSource.success(rawEvents, res.xhr);
            }
            if (calSuccess) {
                calSuccessRes = calSuccess(rawEvents, res.xhr);
            }
            rawEvents = sourceSuccessRes || calSuccessRes || rawEvents;
            calendar.dispatch({
                type: 'RECEIVE_EVENTS',
                sourceId: eventSource.sourceId,
                fetchId: fetchId,
                fetchRange: fetchRange,
                rawEvents: rawEvents
            });
        }, function (error) {
            var callFailure = calendar.opt('eventSourceFailure');
            console.warn(error.message, error);
            if (eventSource.failure) {
                eventSource.failure(error);
            }
            if (callFailure) {
                callFailure(error);
            }
            calendar.dispatch({
                type: 'RECEIVE_EVENT_ERROR',
                sourceId: eventSource.sourceId,
                fetchId: fetchId,
                fetchRange: fetchRange,
                error: error
            });
        });
        return __assign({}, eventSource, { isFetching: true, latestFetchId: fetchId });
    }
    function receiveResponse(sourceHash, sourceId, fetchId, fetchRange) {
        var _a;
        var eventSource = sourceHash[sourceId];
        if (eventSource && // not already removed
            fetchId === eventSource.latestFetchId) {
            return __assign({}, sourceHash, (_a = {}, _a[sourceId] = __assign({}, eventSource, { isFetching: false, fetchRange: fetchRange // also serves as a marker that at least one fetch has completed
             }), _a));
        }
        return sourceHash;
    }
    function excludeStaticSources(eventSources, calendar) {
        return filterHash(eventSources, function (eventSource) {
            return doesSourceNeedRange(eventSource, calendar);
        });
    }

    var DateProfileGenerator = /** @class */ (function () {
        function DateProfileGenerator(viewSpec, calendar) {
            this.viewSpec = viewSpec;
            this.options = viewSpec.options;
            this.dateEnv = calendar.dateEnv;
            this.calendar = calendar;
            this.initHiddenDays();
        }
        /* Date Range Computation
        ------------------------------------------------------------------------------------------------------------------*/
        // Builds a structure with info about what the dates/ranges will be for the "prev" view.
        DateProfileGenerator.prototype.buildPrev = function (currentDateProfile, currentDate) {
            var dateEnv = this.dateEnv;
            var prevDate = dateEnv.subtract(dateEnv.startOf(currentDate, currentDateProfile.currentRangeUnit), // important for start-of-month
            currentDateProfile.dateIncrement);
            return this.build(prevDate, -1);
        };
        // Builds a structure with info about what the dates/ranges will be for the "next" view.
        DateProfileGenerator.prototype.buildNext = function (currentDateProfile, currentDate) {
            var dateEnv = this.dateEnv;
            var nextDate = dateEnv.add(dateEnv.startOf(currentDate, currentDateProfile.currentRangeUnit), // important for start-of-month
            currentDateProfile.dateIncrement);
            return this.build(nextDate, 1);
        };
        // Builds a structure holding dates/ranges for rendering around the given date.
        // Optional direction param indicates whether the date is being incremented/decremented
        // from its previous value. decremented = -1, incremented = 1 (default).
        DateProfileGenerator.prototype.build = function (currentDate, direction, forceToValid) {
            if (forceToValid === void 0) { forceToValid = false; }
            var validRange;
            var minTime = null;
            var maxTime = null;
            var currentInfo;
            var isRangeAllDay;
            var renderRange;
            var activeRange;
            var isValid;
            validRange = this.buildValidRange();
            validRange = this.trimHiddenDays(validRange);
            if (forceToValid) {
                currentDate = constrainMarkerToRange(currentDate, validRange);
            }
            currentInfo = this.buildCurrentRangeInfo(currentDate, direction);
            isRangeAllDay = /^(year|month|week|day)$/.test(currentInfo.unit);
            renderRange = this.buildRenderRange(this.trimHiddenDays(currentInfo.range), currentInfo.unit, isRangeAllDay);
            renderRange = this.trimHiddenDays(renderRange);
            activeRange = renderRange;
            if (!this.options.showNonCurrentDates) {
                activeRange = intersectRanges(activeRange, currentInfo.range);
            }
            minTime = createDuration(this.options.minTime);
            maxTime = createDuration(this.options.maxTime);
            activeRange = this.adjustActiveRange(activeRange, minTime, maxTime);
            activeRange = intersectRanges(activeRange, validRange); // might return null
            // it's invalid if the originally requested date is not contained,
            // or if the range is completely outside of the valid range.
            isValid = rangesIntersect(currentInfo.range, validRange);
            return {
                // constraint for where prev/next operations can go and where events can be dragged/resized to.
                // an object with optional start and end properties.
                validRange: validRange,
                // range the view is formally responsible for.
                // for example, a month view might have 1st-31st, excluding padded dates
                currentRange: currentInfo.range,
                // name of largest unit being displayed, like "month" or "week"
                currentRangeUnit: currentInfo.unit,
                isRangeAllDay: isRangeAllDay,
                // dates that display events and accept drag-n-drop
                // will be `null` if no dates accept events
                activeRange: activeRange,
                // date range with a rendered skeleton
                // includes not-active days that need some sort of DOM
                renderRange: renderRange,
                // Duration object that denotes the first visible time of any given day
                minTime: minTime,
                // Duration object that denotes the exclusive visible end time of any given day
                maxTime: maxTime,
                isValid: isValid,
                // how far the current date will move for a prev/next operation
                dateIncrement: this.buildDateIncrement(currentInfo.duration)
                // pass a fallback (might be null) ^
            };
        };
        // Builds an object with optional start/end properties.
        // Indicates the minimum/maximum dates to display.
        // not responsible for trimming hidden days.
        DateProfileGenerator.prototype.buildValidRange = function () {
            return this.getRangeOption('validRange', this.calendar.getNow()) ||
                { start: null, end: null }; // completely open-ended
        };
        // Builds a structure with info about the "current" range, the range that is
        // highlighted as being the current month for example.
        // See build() for a description of `direction`.
        // Guaranteed to have `range` and `unit` properties. `duration` is optional.
        DateProfileGenerator.prototype.buildCurrentRangeInfo = function (date, direction) {
            var _a = this, viewSpec = _a.viewSpec, dateEnv = _a.dateEnv;
            var duration = null;
            var unit = null;
            var range = null;
            var dayCount;
            if (viewSpec.duration) {
                duration = viewSpec.duration;
                unit = viewSpec.durationUnit;
                range = this.buildRangeFromDuration(date, direction, duration, unit);
            }
            else if ((dayCount = this.options.dayCount)) {
                unit = 'day';
                range = this.buildRangeFromDayCount(date, direction, dayCount);
            }
            else if ((range = this.buildCustomVisibleRange(date))) {
                unit = dateEnv.greatestWholeUnit(range.start, range.end).unit;
            }
            else {
                duration = this.getFallbackDuration();
                unit = greatestDurationDenominator(duration).unit;
                range = this.buildRangeFromDuration(date, direction, duration, unit);
            }
            return { duration: duration, unit: unit, range: range };
        };
        DateProfileGenerator.prototype.getFallbackDuration = function () {
            return createDuration({ day: 1 });
        };
        // Returns a new activeRange to have time values (un-ambiguate)
        // minTime or maxTime causes the range to expand.
        DateProfileGenerator.prototype.adjustActiveRange = function (range, minTime, maxTime) {
            var dateEnv = this.dateEnv;
            var start = range.start;
            var end = range.end;
            if (this.viewSpec.class.prototype.usesMinMaxTime) {
                // expand active range if minTime is negative (why not when positive?)
                if (asRoughDays(minTime) < 0) {
                    start = startOfDay(start); // necessary?
                    start = dateEnv.add(start, minTime);
                }
                // expand active range if maxTime is beyond one day (why not when positive?)
                if (asRoughDays(maxTime) > 1) {
                    end = startOfDay(end); // necessary?
                    end = addDays(end, -1);
                    end = dateEnv.add(end, maxTime);
                }
            }
            return { start: start, end: end };
        };
        // Builds the "current" range when it is specified as an explicit duration.
        // `unit` is the already-computed greatestDurationDenominator unit of duration.
        DateProfileGenerator.prototype.buildRangeFromDuration = function (date, direction, duration, unit) {
            var dateEnv = this.dateEnv;
            var alignment = this.options.dateAlignment;
            var dateIncrementInput;
            var dateIncrementDuration;
            var start;
            var end;
            var res;
            // compute what the alignment should be
            if (!alignment) {
                dateIncrementInput = this.options.dateIncrement;
                if (dateIncrementInput) {
                    dateIncrementDuration = createDuration(dateIncrementInput);
                    // use the smaller of the two units
                    if (asRoughMs(dateIncrementDuration) < asRoughMs(duration)) {
                        alignment = greatestDurationDenominator(dateIncrementDuration, !getWeeksFromInput(dateIncrementInput)).unit;
                    }
                    else {
                        alignment = unit;
                    }
                }
                else {
                    alignment = unit;
                }
            }
            // if the view displays a single day or smaller
            if (asRoughDays(duration) <= 1) {
                if (this.isHiddenDay(start)) {
                    start = this.skipHiddenDays(start, direction);
                    start = startOfDay(start);
                }
            }
            function computeRes() {
                start = dateEnv.startOf(date, alignment);
                end = dateEnv.add(start, duration);
                res = { start: start, end: end };
            }
            computeRes();
            // if range is completely enveloped by hidden days, go past the hidden days
            if (!this.trimHiddenDays(res)) {
                date = this.skipHiddenDays(date, direction);
                computeRes();
            }
            return res;
        };
        // Builds the "current" range when a dayCount is specified.
        DateProfileGenerator.prototype.buildRangeFromDayCount = function (date, direction, dayCount) {
            var dateEnv = this.dateEnv;
            var customAlignment = this.options.dateAlignment;
            var runningCount = 0;
            var start = date;
            var end;
            if (customAlignment) {
                start = dateEnv.startOf(start, customAlignment);
            }
            start = startOfDay(start);
            start = this.skipHiddenDays(start, direction);
            end = start;
            do {
                end = addDays(end, 1);
                if (!this.isHiddenDay(end)) {
                    runningCount++;
                }
            } while (runningCount < dayCount);
            return { start: start, end: end };
        };
        // Builds a normalized range object for the "visible" range,
        // which is a way to define the currentRange and activeRange at the same time.
        DateProfileGenerator.prototype.buildCustomVisibleRange = function (date) {
            var dateEnv = this.dateEnv;
            var visibleRange = this.getRangeOption('visibleRange', dateEnv.toDate(date));
            if (visibleRange && (visibleRange.start == null || visibleRange.end == null)) {
                return null;
            }
            return visibleRange;
        };
        // Computes the range that will represent the element/cells for *rendering*,
        // but which may have voided days/times.
        // not responsible for trimming hidden days.
        DateProfileGenerator.prototype.buildRenderRange = function (currentRange, currentRangeUnit, isRangeAllDay) {
            return currentRange;
        };
        // Compute the duration value that should be added/substracted to the current date
        // when a prev/next operation happens.
        DateProfileGenerator.prototype.buildDateIncrement = function (fallback) {
            var dateIncrementInput = this.options.dateIncrement;
            var customAlignment;
            if (dateIncrementInput) {
                return createDuration(dateIncrementInput);
            }
            else if ((customAlignment = this.options.dateAlignment)) {
                return createDuration(1, customAlignment);
            }
            else if (fallback) {
                return fallback;
            }
            else {
                return createDuration({ days: 1 });
            }
        };
        // Arguments after name will be forwarded to a hypothetical function value
        // WARNING: passed-in arguments will be given to generator functions as-is and can cause side-effects.
        // Always clone your objects if you fear mutation.
        DateProfileGenerator.prototype.getRangeOption = function (name) {
            var otherArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                otherArgs[_i - 1] = arguments[_i];
            }
            var val = this.options[name];
            if (typeof val === 'function') {
                val = val.apply(null, otherArgs);
            }
            if (val) {
                val = parseRange(val, this.dateEnv);
            }
            if (val) {
                val = computeVisibleDayRange(val);
            }
            return val;
        };
        /* Hidden Days
        ------------------------------------------------------------------------------------------------------------------*/
        // Initializes internal variables related to calculating hidden days-of-week
        DateProfileGenerator.prototype.initHiddenDays = function () {
            var hiddenDays = this.options.hiddenDays || []; // array of day-of-week indices that are hidden
            var isHiddenDayHash = []; // is the day-of-week hidden? (hash with day-of-week-index -> bool)
            var dayCnt = 0;
            var i;
            if (this.options.weekends === false) {
                hiddenDays.push(0, 6); // 0=sunday, 6=saturday
            }
            for (i = 0; i < 7; i++) {
                if (!(isHiddenDayHash[i] = hiddenDays.indexOf(i) !== -1)) {
                    dayCnt++;
                }
            }
            if (!dayCnt) {
                throw new Error('invalid hiddenDays'); // all days were hidden? bad.
            }
            this.isHiddenDayHash = isHiddenDayHash;
        };
        // Remove days from the beginning and end of the range that are computed as hidden.
        // If the whole range is trimmed off, returns null
        DateProfileGenerator.prototype.trimHiddenDays = function (range) {
            var start = range.start;
            var end = range.end;
            if (start) {
                start = this.skipHiddenDays(start);
            }
            if (end) {
                end = this.skipHiddenDays(end, -1, true);
            }
            if (start == null || end == null || start < end) {
                return { start: start, end: end };
            }
            return null;
        };
        // Is the current day hidden?
        // `day` is a day-of-week index (0-6), or a Date (used for UTC)
        DateProfileGenerator.prototype.isHiddenDay = function (day) {
            if (day instanceof Date) {
                day = day.getUTCDay();
            }
            return this.isHiddenDayHash[day];
        };
        // Incrementing the current day until it is no longer a hidden day, returning a copy.
        // DOES NOT CONSIDER validRange!
        // If the initial value of `date` is not a hidden day, don't do anything.
        // Pass `isExclusive` as `true` if you are dealing with an end date.
        // `inc` defaults to `1` (increment one day forward each time)
        DateProfileGenerator.prototype.skipHiddenDays = function (date, inc, isExclusive) {
            if (inc === void 0) { inc = 1; }
            if (isExclusive === void 0) { isExclusive = false; }
            while (this.isHiddenDayHash[(date.getUTCDay() + (isExclusive ? inc : 0) + 7) % 7]) {
                date = addDays(date, inc);
            }
            return date;
        };
        return DateProfileGenerator;
    }());
    // TODO: find a way to avoid comparing DateProfiles. it's tedious
    function isDateProfilesEqual(p0, p1) {
        return rangesEqual(p0.validRange, p1.validRange) &&
            rangesEqual(p0.activeRange, p1.activeRange) &&
            rangesEqual(p0.renderRange, p1.renderRange) &&
            durationsEqual(p0.minTime, p1.minTime) &&
            durationsEqual(p0.maxTime, p1.maxTime);
        /*
        TODO: compare more?
          currentRange: DateRange
          currentRangeUnit: string
          isRangeAllDay: boolean
          isValid: boolean
          dateIncrement: Duration
        */
    }

    function reduce (state, action, calendar) {
        var viewType = reduceViewType(state.viewType, action);
        var dateProfile = reduceDateProfile(state.dateProfile, action, state.currentDate, viewType, calendar);
        var eventSources = reduceEventSources(state.eventSources, action, dateProfile, calendar);
        var nextState = __assign({}, state, { viewType: viewType,
            dateProfile: dateProfile, currentDate: reduceCurrentDate(state.currentDate, action, dateProfile), eventSources: eventSources, eventStore: reduceEventStore(state.eventStore, action, eventSources, dateProfile, calendar), dateSelection: reduceDateSelection(state.dateSelection, action, calendar), eventSelection: reduceSelectedEvent(state.eventSelection, action), eventDrag: reduceEventDrag(state.eventDrag, action, eventSources, calendar), eventResize: reduceEventResize(state.eventResize, action, eventSources, calendar), eventSourceLoadingLevel: computeLoadingLevel(eventSources), loadingLevel: computeLoadingLevel(eventSources) });
        for (var _i = 0, _a = calendar.pluginSystem.hooks.reducers; _i < _a.length; _i++) {
            var reducerFunc = _a[_i];
            nextState = reducerFunc(nextState, action, calendar);
        }
        // console.log(action.type, nextState)
        return nextState;
    }
    function reduceViewType(currentViewType, action) {
        switch (action.type) {
            case 'SET_VIEW_TYPE':
                return action.viewType;
            default:
                return currentViewType;
        }
    }
    function reduceDateProfile(currentDateProfile, action, currentDate, viewType, calendar) {
        var newDateProfile;
        switch (action.type) {
            case 'PREV':
                newDateProfile = calendar.dateProfileGenerators[viewType].buildPrev(currentDateProfile, currentDate);
                break;
            case 'NEXT':
                newDateProfile = calendar.dateProfileGenerators[viewType].buildNext(currentDateProfile, currentDate);
                break;
            case 'SET_DATE':
                if (!currentDateProfile.activeRange ||
                    !rangeContainsMarker(currentDateProfile.currentRange, action.dateMarker)) {
                    newDateProfile = calendar.dateProfileGenerators[viewType].build(action.dateMarker, undefined, true // forceToValid
                    );
                }
                break;
            case 'SET_VIEW_TYPE':
                var generator = calendar.dateProfileGenerators[viewType];
                if (!generator) {
                    throw new Error(viewType ?
                        'The FullCalendar view "' + viewType + '" does not exist. Make sure your plugins are loaded correctly.' :
                        'No available FullCalendar view plugins.');
                }
                newDateProfile = generator.build(action.dateMarker || currentDate, undefined, true // forceToValid
                );
                break;
        }
        if (newDateProfile &&
            newDateProfile.isValid &&
            !(currentDateProfile && isDateProfilesEqual(currentDateProfile, newDateProfile))) {
            return newDateProfile;
        }
        else {
            return currentDateProfile;
        }
    }
    function reduceCurrentDate(currentDate, action, dateProfile) {
        switch (action.type) {
  0 ���.���0�9PN r����D
|��u�A K�Y	 �J�44� j��Ꮜ �ڑRi �r�X@��`�JQg�8�G�f�PD%N � �N������#( ����`'��uZ�%�`�{< V �9@2��g[BS�@NT�� �Ԉ�@JJ�Ԟ��LRJ? @�k��C#��Ns���$c��#*=�})1?�, ���B"� �G�^ 
4�
���!Ξ� IJHP� |3O<�����e� ��gX ��F�� �B �0�Ҳ8����*@��%�fV����� Ġ� �$�k� ���� BJ�ˬ���)0�y��V�	�X�%$ʇ�P(��� O�':V t���L��Հ���@9ᜉ3���㟌:T%qXjI�� ̤�U$c P�UA ����Ά�	BC ����JJhJ�J�^�8 �΄bV �L�J L�� �*Ϧy@D���S�#�0A�/����~� Tr�\ 
�Y��P @��"O� 릳��W�k��╀@�"� �& 
��( ��� OJg)y@)�"�AH � Y���@��r�@D��
��?>��5R���$L�A�����S�p�3>p#j@��!!5I�S<b��(�� H��>�C�b$E�� b�U�	^�(r8��N(�@@1�I����S/�(i�Ä�� %	\< 
��P ��( �U��`�!S�P��N�
s��@
dq���^��4|'ی5+���*�~=z�
O�#	a9l����`��(L���� DEU���T��`R����t�?�
B�LЂj)�@$��� Y��G�H�U��0 YᏞI ,���0�4�z$ �LUz���x�����3QEH%��1�b��|��2]��B�V ���P�$��@L����!"��3(	e.�X 	�� #q ��$�	%�8(�+\S��T�N��.�5�����
� X��r8 MT�f+ �)�S�@ <� $�&�(���`g ĦdELPeԟ�� /�B�R��!
��|�#�6��@�� $�e �%*�`�%W�J2���8DdDP�@��A4��&�*�0��_��gH�Rt���A��Ԉ��I44� �	$�~�25�(%D�^����� X��}4������=��`2����+/3%�M���e �"�3 ��
��	�0�`O1��(*�������0��s  W�(O�p��f`��Q P�t�@I���� ��S  ��~�� A_��@#�Ul��̬���43HP�/�UO� �j���@AI�0�0:�TJ!E��� B~,qHL���%L� T���I D��<���j�)@D�HH��X���HFFe|��eTS([�Rf�� ��$񛱀&��MV'�5E� �p���J������2}HrQ����{1 �H��`��� ��MeB`�Oo�(S*�����8� $u:r+O�/H	!d1DΠ��N�j` d�(r�� *���2H�A$����P�1WT&Y@ �� �� A��SD������%(
 �AH�'��r���`��9���"�)���X*�0��*��Ȕ
� ʉ��(�0 Brt%C_q���W�h�`��I Hb�� T��=��T�Nf��e&'4ΰ�� (�H�:�D��XW��J�<z�,̿� Jq� 19&" ��?��9�yϤ �~P8�Q�
f�H�j�Z��
T�*�
�A AO��t����IB�N �����b}I���%f� "���/���� T%����$0	@
�p�fI Ѓ_ 2�	U���}�a U��tH@����)�{�F �^�X
�8�V��F ��( Ȫ�� #! f*O�`x4�1�bG��
��5�?�I#�)�/���0�����^��� �����@I֕#��r%zRY,EJ/��!�1�u�(�2)�A,'L"�5I��b �
�!�EER?(!��	3Q��g��d��2������ (:(���e~PJD� p�H(E%_��Ni� ���S�$� @?�I\� �O�b S u�����@�V ��"s�jD�� "H��?)�f<�Bf@4#�� A0�   �h 	� ��8�d(`���� Ȝ� �*b� �u�$���d��i�H��Np	t��H !�^?���8)���I��?� �Ă�~� ��u'�'*� ��BV �O�`��D� %%8�P�B��d�f1! %	>@u5��rY��x�� �`QI�s.�T�%+7� ���jСY(�@"I��S�R���8EH|��t �	6�
%s�.
�c� ^��p���D�$I~,0�(bfaO�D@L ��p���G�Q��P(Z��u��I* � �5��k�� Y�3qR���\��,��H�tD�� ��ä 	ʳO�
'W	 QҢ$�AB:@!<fj0�`�(��zg ���	@��p�T4Q�bB�q8���ä 3F OR�`�:�$ �< RBLt�`? �J�K� JD˩�X�]<V@!Q3�� *�cE� d+O�8�0�fJ� ��VI�� R=��$Z��y0f*q�Rp�A$���>b ���X e)�@sTΐ�
��d}3�  'CI@ JxIPO���:D�9��}Nc �*:� ��:c8!J�P	�8A�3� �T'����g��`���4&f�Fց0�
�M����&��J)��!?�@��aIK�R����Ѫ �y�.xJ��㗄J���U
|:��8��{�8Vu N-q��{�1A���4�L� ��P�\(V(m��>?��3�PL|U�	$&S�ʯ�Ǥ �*}��e)E��gN�r�1OoXF�8��� ��!�11Ic �z�� UP���	!�r��"	MN9��9�:�(�
�e*����1�@(S�) $��p��Ȫ�)�H'Q<�@�=� j� �� [,� $ �{k ��CLj�0Q+����M3X:}���!��/� �+Цx!�Y�J�*x�  ��$ P�ä�5 /E�R��j
�1� ڒ	HS�  ��7�5�ǲ&~@"$�f�&pL`"�$r�� 侪��*�g�0��0�������u3�P�
x� ��A�X(94N��R���=�$aAD	"k�*�k�3�Ae�O!A ��e� ʤ}� T��� À����R�I���8 �(
�����hF	���B��COL�� �P+X��1�4Z��� ���p�(p� ���� 2"����)P�1B����O�' �!BʋX��f�j�?o8 U���L�� $WĞ��#৤ s�� *���qQ�Q�@ �4I����)�$��E%j �>G(5��X �^�I3�u�RSEY�� ԕ��$jS��E��?� ��Qz�0df� �?t�G���)C�� +�%z@#��}��K�0��̄\� ��Z�d'_Ռ*+��Y@�r��L��%����@"Pj�1D�DZ⿔ ���S?��	�?��u5�Di@qǧX  @!X� E:@ 
��4�*H�@)��}���R+ L��:�"Ug.�D�d�&��j�0ư) PU�(��U+ �k�O� R��ye �P}� ( *��O� �K����آJ� 
H� ����% �����D�k�q��e &g8�"O�q9e H�0�U��� P��=s�c!��0㚵{s}��ѵ�;��W���4�y��o�����?Ԟ"�b�	��̽��~E��m����Z�i�)X��t���������7�������k\�say�(�շ:�{��Ôs�}z���n���rCzϗv��n��D�A�N1ߏ���y������ITQ�Q*�TI�0B�j+ 
� ��KD�p@t( C��Y�� OJ��XQ*�� g�J�:�	(��T%P���QD��(J�P%~� ��	D@5�+:����q�<D���'�\�� &�� ��:U+'5�]V�T�d���W���� �`q5��y�� !�� 	�)@�B@4���1�P���"�J~F.� ���X�����2P&#H$�+B� `��X��1X�TʐW�%� C���DJt�'P0�	}���4Y�$H����
����T �X�4� �j?8�}$a �&+�� )] ��y T�� ��
� ���~�@��j~�5�4'�(2'��0�o��� ���U��+�O�z�* �:@5_R(HB�^��X&ަefb�g!�V(���I� A�8�X���+|�Ϳ*]�o8�I��l�>v��\�����a�f�m�]�v��� �@��zupa��iɲ��F�7;[��w콪װȰ�~��7�}ͽ�����^v���,�7W	u��^isl����ZCq�w�71�^����ֶ�>�@�)�s2�Y��Z��T ��QE3�ua�@!!P�}`$ U�3L�	��g:N �k���Z*�%���t� U	ZN �)$��&���s��#$� $��r� �U�JJ��s\�`QS*y@ /�0�P3�:@+04��`3�)H � �˨�s�RU� �!H�s���r�Y�� C��� �e��@ ��c %d�� �����j��&����H� ������J���@��0�Z��a�'�� 
|�*`��P$�q5= 0�
Z�� ��Ed�`$�/�p�T�G�9Ҟ�8�USN�� *�7 ��";f�� �-*$�۬i�#Y� (�@J���� �!���( �`L���@J��5_�L{V��*% �k%+�H����L`
W,N0!2!N0
B�G��$��c1e�n�:���<|�r/����WMd��������7t]��s��?�h(�T�G�Lת5��r�|���ۛ���޶�~ך��-�{{X[�j�.�5��7�|#=�v�lsz-X�9�.#]ks�����]&��nr9]]/��}���՛}�.���/_}����=/z � h����bV�e�c�I��9�f&m�LIT��i@��PP�1��H��N0A<������NT
a!������P�X�O��+�``B���=  >&���*� 	�5\`9KP�H L̖9s�	8�9�:�4����( L���� �3\�IEUN^PZ-f ��W� �dG�t)� �Mg:b`����G8$�k� $'��0 DD?�R
� %%��U��� X �� ��c �?�� ��Rj��J��`����2�E� �	�	����, @��Pi �C�z-`�"��]c1_(�r�@SZ GHʙ5 K��H�T�����
��A�(U|��ĺ�)�T����)�
�aS���
j��G0Hx &�[�B���&�JApe<�g
?9@�Eq�<�P)
��)�X!���0jF��;�MfŎ��� �̚�y�v�u�z���W��زݒ���$��TCE#(����\9Wf��]�;��n�;A��]۽���P�?T���&1\��r����� x]�3s�oY~�v�2ųq��qdǎ�/F�˳���]���!xݼ�sZ��c| �z��z�m}��	{ed,�CE@Ix���)�S(��Z	��H����$M �J�=`"z���J���:t��0DIA<p9�<+��� dP%��("�W�( @<�2Ip�mA�F�k����:������NF�"I 4cC}%f�H����k� ŏ��"y�t���`Z�d  ���z� ���0L��7�bpQY��`$Q	�")+��(�8�G� �*(PO�8�HD �'�fD���VxT�"B"�T@t�9��0"�5H�P�U�D�	s�K54je�Y�~�  *UEO� ��J��%N	A�:J"���2�b��YA�Qj�+�Ol)*������
SR�
O�4B@��`�L�s�$�D!� �T�``�J�
�5C�`q��)	�V_�xH�܄�`)�*�'��
At�AAPJ��Yb��\��cS� ��+�w"��no��I����H*�HG�n���N��ws]�y�i��l�[�m!AŮj.��8��<�f��w��͟�^�����]e�5�c�"�^���5u��Zv��gq��-o�u����0�ZLշ�:h��C�3E��5,U@L�p򋐌�LV�(=���`��Ef@� u� +$��@X�A!#\�r�(P����P(
0�� �p�#( U �`E ���&
x�"+��BP�?f���h�G�� /���X�B�� ��<��$̓T�?M��ʀ���R ��Z��
IJ	��~���~p�f�"��' (���t=W	��Y� �����S�@P� �eH$��:@$�JgU��PHV� |3�0��`2�)8 ��B*z@,N���%* "	h���2 "JQ~�uEq�c@ fq�8�T)
N@Q`%�T` �-
�� �������Z��F
S�>߾��xu0l���� ��q��SJ�� BRa=�`����0 .�%!�
�%�,�'<k �2�,k��]��lF�;I�U�ɍ4�f8����:���������n�����J��щ.H�ů�u��<������u�����nn��L5��ߵ�y��5�O���~�;�q�.c�i ��ij�o}�zG�ٝ���?�� U������LG�����*�Њu�!T�!� �$&G�� ��Z�5B��  �5��8 	�ϤRUp@	TB�8NHOX�R��O>�@��U�TP�$ 4�8AI>ߔ$�Y��J� D b'�~1 JL�b�T�)�k� T&+�PH�� Q98� Q^4�	�Hf��*$�	5���5� A ��6X��5	( ���4�^��xu�Rf�� J~Hs�$L�4�a����S�j $di PI[�H )B�.0	3��
�:���� #$R�*hFP��\�� �3�@%EU=��L�s��S:J^Ȃ��F�Zc��WH���s�)���N��A�=f>�Q���`�W�P'.�a#������)(
�d�Ps����,�@$�g��(\��@��kXQ9��Y�%P�c5�%*��BH"�U9�D޻v�r[3�m�>ǃ}�]��x� �q����k���b�u��2�G��_���|&6�-mC_���-c�f�͵� i2F���"�o��G�������f��n���2+>��8�<�Yں�:$�5�z\�:SM1���)��z&��$�'�jk�GH, �1+� �
gY&x@/q�4����c������&]2�D���T�)		��Pի�p�JΤ�4Q�*���J�F�:������x�	���@���`5��~Q@�イ+<B��)T�X!� AQ��3 g �A�= 8��[���N����� � �Bp	Ji�!82�A( �[3? ~���Y@ �Oy�HR�� Y`0�,�&���$2(iN�M��S	^��X=+��) u!�P�r8���0��\���P�3= (���� k���� �+*����K,��ER���� ��IW	[<:QI�r(��,� D�*��B��H]?�@�"iZHd:�� J��g�2�H�N��Pf�d	�  ��� ��8�	����?۔P�iQ2��2OQN��X�;�����K���bW�9r�j��ן��wP�8+�k���� a��ljz�����ť�g���������h��r�e�	k-̐��#���}o�ѿK8C�������6�O�����I��<�WZ���������t��z��p�5�QR�GD3���!���
���B�
A� �5�`�*�_&	VU3�H2�\p�a Pe9�2�VQf|:��4��|�	c%�O��p���J��IJ�=�C4�2�������

� ��~@�=��)����(�c JjgI�M'	�xD����X���8@�JJ*��R}��Y' jIP+ �"�(5Y��� ���0����gI�=� r�(�c(��=� M���Ά )�2�n����P� �@���Eh� |XV"~���@�FJ��&�s�H=#�g�� ^�JO(��5�� �I�A� �`H��)�Jx� �$q?�s�@Q8)E�H�م+*ID�T@
�2ٯOJ�
�q�Ɠ��� R�=8��su8�	�a( �  ��	�J� 7�����L�<���**�?(e��=Ս**P�� )��*�A/f�ݜ�}�Ya%�?�n�DfR<\���#�_Z;���5w���'n�۰�Y�P/���\L���o�xۻN?q}���of�i�z�/�I��&٬�����^�n�c�� �X`v�ƅ�y^�Q������l�r�VyG����Ӭ!�]`����	��
���4B����$ �0N�Ь�A2���B��(��P1�0XJ�������R�("L��B��%R��.�A!�F~�.�P A��� �$A4�< $��S�X��NF ��*���DZ������t��)�J�R�CD3�E&�1A4��t������	jA#����R�*�/M���1"1� *S��)�R��}B��V .Lg���T�i� 	�$�Ǭ�Y�qQPz@<D�<� �ET��`��&P�}�@9/L�����FK,�O�� ��� V�ҪFp.A)ʝ $����( :s%Fy N�i�	�`�&�� SQ+��-�Mdi���m�Y�# ��dO4�g��� &��R��B?((<����Db��g qJH�4�r���_�@"�j]>O��~,eA 9�W�Z�!�E�������&Ѝ� ��lc}�-kY������*�y�ͽ�Jo]�*ORc��<���ڼy����Eո�#�Z��s��?Lr�f�g�N�������e�=����్Z���Ǘ�lL:Ǯ;gb6�}�� �� �� cG�7Ů#Ͻ�̆��1�,$�6�� ��P�3�F`�RPSR��R�~ߵ �T�N� ��Ȝ`P锥 5�@9'�p� ���	�i��:R*I�A,��>0
z�AB�g�i���qB!dQs�`,���5"�20�Xh���
	AJ��?3 +rU�(T��� ��T��9&T��9*��S ��� I
H@!3҉I�
�� Y�������I	��x����8)�$��g� ���"UPʦ �\1(�J,��e �C��H�A e+��E(�4�D��Hb`�� &C?	�n��B�;�(� #���`J�M"Ag�G6ͥOA��	��<�X��� �ʀ&`�>�'S!���N(cH2�C��  �i* �� I�e	CIu� �������5�$��1�0Q,�� L����j}��2�f�Po������s���qk���>�������C�U��D����_��խ����sj�nE��W�m\k��늽�����oR=q����n��jm�������fB��H�c�f��L�����h��!��&�D�@�� @��\MW�\�	"��|���0KgD,`$���:@ I@@ }� 
k]&3g$��u%e� pR�D�  J���  �?P�ȃ%9t��2G�"\	 +j`�Pc1���I�b�Jfr���v@V	�B�<�$%���j�Zde&���`ID���%�L��SA<���*�X`+f0� !����&By����f%*@F���� B����ߥ %5v���t�RTh���y�LI��!���2�$���.pҾ_���UC� ��PY�S� ~����]}�p SAE�E�Ω �P������uR�� �O3 ���d�dZ�b����~���I��ك$*<��1E2�,@�U&�<���'8
�֥s�L�k� ��AI���i 
i3%PN $'����@4�?��pB~�_�^p�{��{s��s���>3��wu���]��a}ǹ&P
	����b7��y׵��=�����v�\�����s������e���K[3n>]g��mǵ��[�xsL�3}��}���8�iA1�G��ݯ����������uwqp�0��n7/Gih�Y���_&���g@�Y[�Ym����Z�Ͷ.kI��Hē8�r^������0lx� �����J�n^&:qk���^��|����O�I)$�P�4 ���U1�OX (�
���_))��
�� �/C����5��&�"�
L��!�)�IB���B!�~B,�T��NY�%TQČ�G�3��@)�	p�F��b��ITQ%>�"S5(dQ `ƥ"d�y���I�`�If�.�L�E	���"O���Ji*J$�q��b������D�>�1C�H|b�T�O�H��*s��b����oX S�JX���@�����k��YD5i�J 2$bp���Ap�?�d? Uf��&�H��@Zr{�\o}�֬7S�
� _��x̵���W�s�سy�s>sp���X��\ĳ0�f`HfR*�Yt����~	t�]�r�iYV��'�� �ʁ���3�z@"d��Y��
�d=��_����`�E3���,*:@
��=k 	�4Φ�%Z� zQhi�` UH�#	�4�K$���m��� �
�9֓�  ��@:̊�$��і�s��;�'�%�/������nv|������|�Z�1�51ΐp~M��a�Ms+��� ��.��W�m�V9�ga�wk�Ym�7��n�^;���[���j�GO���-|q�8�|n[���nό%��w;�w/[�2�.g8�p뛗�k��F��wj�惽߼�sIAon�i��Yǯ~���t�>��v�,r_Pm�!᧛�y��-(�� v�~�gO8���n>�m$�p2�,��m�M�@1�DM2�wx��ICS�*�D��0 _ ����iI��RP�E��D0��iT�(���I9���_vP�,��  �� Y@2���>�� IϮ� ��T="�P���G�� i�!��J@��:�HA�8�(�(dJiT�cPIj��LX�Mq���	(!APfE<� ���C(��LLaQ��E~Ӏ�	��Jd�Gᯜ\P��H$0�z@1@(����L N�����0}J��DP���LB
��G�<��E��PcK!U�,QU]%��>� *��)�� �L�QA��Y��<�"�@=��!�	Ep�X<wgԿ�{m��*�d� ��ڸߟsl��1��:5+�D܀��y-���ٮ�α�{3�[��1o}��ڶۻ�.�!��A�!����<�^�<�~=}2��*K\B�-���2K}D{2X=3��x� մ%A�PUO�= H*U>�IYH��@"A$eH=#$<�f����j*��j��$��$Z�����1�#	�!֩�
cD��>#����?�@4p�S%�$���S	�����LU>��
�.��*�zS�3�y���u���k]w矓�����kP��'X���e�㞌��m�C���	���l����ۻ� ܼ��N�(����ּ���8���v�7����u�V�4\e�#ctڷ�������� ,[p@5#�zu�MzL������X�W�;������Q��6��u�ij�$��u�Bc:rk,̮�kl��;ǵ;��9�]�7��9�q��v\Z7;n7j��?=�w�꺷n=�yyhW$�}��ۏ_���k|��ޟ��w�����#���!�����y�o3l�6��K�[,��6�5��o:GYiD�bF܍IV�3�d �E�4D�H� � �
ޟ�I�N�U��y� � j49�.�I*�Q )�d��5N2)�HP&U:�qA%�?� UR �(���K��h��` g2���@$tJ���j��� �� �'�(���Y���rI�IE�S {�<i�(�#P!1�PSY�H�(eq�4�I0�F��ؑ5_�0$e��~pB9�f���
��S LS#Wc) [I�@55_#�T ��%N��+?~QP˔��@NL�P&~M$�` ����4�P���8��r�+\�͋��Z���]���j�|��G�Ǖ�^����!�x���ݒ��-�4�uPL�Ƕ�/Og��B���j��I|#Z�+7\*��:�� �� �%:(��!8�  �@�$H��H�~p�ik ��&��Hɍ ,��<R���#Q�Q0� MD� ���a2��@�p�ʘ�2��Ɖ ��3PVS+C���z��jdrC (��I� VF�8��e��� H#A���� ��cn��=���04����qQ�:FK^{�W��r�������p���l,[[�7�p��{c��1�i�O���o�[���e�N�������ym�Ìva�_�@{��}���I��l�������Y��h�2�\5i35�^�M:{�k���:Wf}�v�n���{��Y��n�uk��g��ojyqs�\:Ce#��ɝ���x�ĳ.m���˱o�����v�a�nm�������n��a-a��1��Z��X�7���� �6��+ѿ����o�n���y�����Z	?�.p�{}��^�ތ���$vq
�"k2<1�6���)9&3C��8���HRkA%���Z�59D�`������_�@@�()
�ӜP�]0#�	�Hh��L��	��J��
B�B� eޢ�$c @���� �% �J `�r"�E�Ԕ¡O���%Hw�}�&�	 ϯ�5A"A*��
F  +:c8@��J.PP��xA)��괃!P}�?d ����(�D�U����H�PִI�"��T��*�J��_���[7n�4)��f���wV��#hø!}g��e��>����^?v���[t\���~�Z���ǟn]����E�����לL���K�r�B��jz�	!U=�Rۺ��5���]M{	Q�&"3k�޸:��κX]��Vɳe��3;nV��l��b���c��N+�&��X�6���av�� �`T�~Q�mg�9�r�c�u���}��iA��糝�4�2Ls����.�}� 
1��HhL�!(B�0���@�)��cT�F'�c���e>�nU(�P�(IԬ�@	CR=�B���������V] &+\V�`���RpS�VXT	�A	�所��$������+�mڶ���-ض�q�q@�4)'
@Ê�G�[����^hSsom�n�H��EH���^�u�r���>�i���u�o�w-�y6.\��nu���j����[�˳B��ܻ�I��^�nm��wd�\�/�q��JIf	X��뎯?%�����͸��r����q��os�[ܖ�|�h�\x�H��ɋ�7�:W�y��[�[��.��sۋ��3���5�Kyv�����x�,nt9� k�Q��g��RJ�}�ٝ���m��>Z흭�o��V�ۍ�Ŗ�sz� p���hz,o�k��y#��
��/y���m�ݍ���w\u�w��ݷ�{�KwH?�>Hc�խcZ띲��L;��3@s��;��%��ag���&5&PR�9�"%$� �{��CY�QN30 8B��@�3������I� �t�v^�KH
d1�
�%T��s��V��A	�g ���
`�*��<�p�˦f
`�$���S��� �R���"�3$�� NS\r'��Zң���8	*(��uH (L��
�&�dF1D���:t�
@Q	3�K 
��ǭ`�����d�_(&(s�򀗾 �j)��s5�ЌP�^��+\�/����z�W6��rKQɣ8��V��-��SpN��;v�+m�cŶ�n�D�I�J�٤��������?ib�k�HL�@M�v[a{Z�)-2�D�m����;@ҏ%���s�+J�u�?E�#?4�Z�~PD��'Yz(���O�x@��l@i�*�$�R�x�e��o_oJ�6��>1�Y���n�δ��8z�$.8�JK����1��ĶomM��!$LA�#�,��c��r6@���"sPFy�� �L��,���P
rS3X ��h$�@b��S�"f��
D��	T�`@U2�t&h�f�}4��	*i�G<��(��� JW���J�g)@GP'���-wmk�ޝ�C����q�a��-D=Lg{�W^��@�9�?uf���ܳ�o~��.߸KXCϥ]�&j#˦��ںOkm����;��\��/��
�b��k**$q�W�[^�mn�ü��kM���kY�� qq��9Z��#�7���[^�쟡�/�g%�m��ͷ;is��E��å�q��Ԃi�.�mfm���?y�iûp˻�ˬw�ز�Z�m�<̀�\	em����h���[�<�2��qv��r�͝ݻ7K]n�XK�` !c�w�ПG�ouڝ��l7�6�۝��Z!e����p�-��&=�<�\��\O\<�L�J-W!�@�!@�& 4J`A�Jej|��L�PO����3��^�:��= �9��BY�:��)� ��")���3���bfD����$e3�f` �LtI�@<
� ��BT�`O��0$�b�E' ��O��� �r"��8*�`q�?J���c�jc� Hi$\r�(��"�I�@��șK�x���)�:�!�@���4�B�j� N�t��'� S�hR(�e-Nq�Q�}�;��qJ��'ҕ��*-9NR��v��U�tس���ቌo���Z������ۻ��׸��Q>� h�( ��[���J���?�9s��diym�m�4�뛪nr��c"��X�և� ����h#FS;M�����\������,����>����Uʳ��n��hQl�},�0i���P���F �k��X� ���n��F�:i쁅V��p��"��#���+�C5)���V+5gt�z��}������?����{k���%���Q#���T�0k%3�4"T0��8��-$����0�P��"IP���N���ް]@\g��_H ��pP
����
�q�E�5� ��X5.iC�S2d���i�/8�������&B�?��&E�� gg��n6[��cr�n똚�4sI�p�0�.��U�.\^�-�w�;����/����\�1��[������;����_���V��B�Ű�.5�*�Ȑ$���]�����oj�.��9}��۽�y+{M��7�mnL®/y�D��m�z#x羸��ݾϖݍ�����>v٧qw�f�Ԑj��śo��s�k/T�=���o�7���'���5�6��ٶ붶�m�ߓzݖ��5�O�=Nf1�Yu�G~u�~��� �:6���5�[���6W���v��r㤡.`�A��3�}����x6��$�����s{����7�h���w�I�����]������;õx���l�ke��ٸ6��{�9�-s���s\5 ��m7�L�N?����9� __durII
*��TE@i����`��6�"�sJ��^�	yg"CA�I�� �"�3���%R��0Q��A	`N��A@D**2� �� p��`2S!�@AQ3Q��t� �A 
©󂜌�&�t�/<R(?3���C5���t2���@��$OQ:p�+ M��@%r!�@0C�J# �Nd���`�,B��K�H\I��R
)�>f�#�P�L��(�D2��+ �E�����\Յ���4@T�����N���e�j�r�/)�='H������h�a�$�K��X��m�	
	)�ۑ8�:DD^���I�ۘF4#��a�$
�4�W�5��}���ޮ�&n�P�q� :�JjP�'�lh��|�	�C�3� 0H4����(��S���xj�9�۪`)?a��k�؛�/�9��i�i\㮺���@�Zr4+���U��ߍ�e=��^m��fc��GM/�;OU�8��IJq�� R����' ���8y@�:�g�j �ת���,�\i �|GR�O��'J�+I�PhD��V ��Y�,��P�EI2���A)̙�C�� ��*�
Q�Y�e������q0Tf��J@rϩ\��\���m�[;<p���Kw�ߺ]w���cZIǟ����:eʻc��=����/������e����Am�Z^dj�V�'H�{2�W������;��m���=�-ڵ�m�O�_~��֟����kq�1�齒�c����vS�Kw���W,���v���6��~�� 1�n�-޴�g@�st�+;cn������\᷼]�����Z;{;vL���&5������eOK7� �����>���6�!oe��Z�칀Zh��t���������9+�˦�Y��.f� ��v��u�o?�w�l���;w���~����n�d��G��]u�3�;��\L��۽�������_�8�v�66���m���W;[����n[�帓�%�J��k�fB�ڜ� ��	��X�|�`eSXxx@)&*G�� �d��WD����1Y�	@~��L �'Z�V��<��Jj>�@72�@"�Jx``t�)U0��'�R B�L�
��8��� JP�(	��&��*"�"�	�2�� (S MI���̈�L$e3�
��� �P��$�P)�� d>��&s�\ 3 ������  �J�A�z�q�xw�k� ��Wx�r帍�:��\�nn�����2���H��Ѷ�ki���*�a\}�x�[e��s�)�9	�Q�2W�d�1�nu
F@c���X�t7KZ�J)�^���_�{Ye�mk*�� �#8mw������iV�A5C\b*��Ѩ�2�4H.V76��1����?��%0���i�Ql9�A��%E��~���W�Ӣb'�3kv�m�K �]�='SJ�{5�6�n�����q  ���h�eq�ۭ�.5ӓ��b�+�w>m�]�Q�ӈ�1�\̹يhS��q���D�������T��||�0�hd��>���ڄxP�	H�9��}�>���LԦ�r&]` T�D�D��XACh*3��S4�� �DA��
��
�βZ�S�\��:���Au�d}��~�r���f�9����l�psE�b��A� �i!1X��7/l��m�J{c{����ۇu�s[��`7��h�k��
���ܱ/V+�x}��Nk��� �x���7q�;�hg�����#��\t����۶��W.��]��ퟣ]�ߟH�C�wֹ>?�x�V�{6m�7g��.���������jLG�]��y���)ضm�=�a������+��q�{]�vv�{��-�-pG���1��^�uG�l:����We�_P{�s�]���7�k{Wp��BӷA����[��6ݧ9�BZZ����[b�3%\w7om;��66�]�bv;��{�m���]�sH�~K {�7�����u!�	$���v���{ͷ��`n��o�7�z\����3�s�ƹ�n9��LƤ�r\��+ΐ �u �H���2�X ��x{��H����/QD�3X�"���, �<�x�.�| �*�(p�X2s%Vx-L rJO�8 �Uj?( ~ �R|:�@=S�0Nʾ�4�� �(�̉����	��	A�>��`)GI%S�(\@)� `�f $uK�����ν` H$) ��ST�8)�M���E�`��)yC Y��+*� �ɢ���I����L��ߺf��FY`s��s�.���]��F�fՇ����yR��'Y�ャ=��l�� �!	�k?o~�ɷe�`�f�"�ڊ����b=���\1�VJ� �-�v��@K@썲����>��m�5���%9�b�2׷� ��@{�CX�^��(��]c7��n,<��Y%$ZH��b�E����[7-|�9�S�����O����7\�{.7N�`
5z2�[���l��h�X���E�.v���ص�k��g0Z'�㴘r�[]��Ѥ����^���V iTp���6����(
p�c�E���]��Qs ��_	�/xl��ta'R�����!���(0�C�L��R��Iu  8� )"X�`�e5^�PP���:�(�z� -O���E5:d�ԜS1@��35$@"@G
d�\�̞�`-����kz�w�7XZB�E�^�,�Yq^j��������m����<��~����/��w����ХMX�u���ͦ˸7m�v�<k���5�o����0��O� ��y�]?�2e�;a�w9߼�d�af� w�qV�{���W�v�?�r�}K���.��w�\|)�� C�;����`l�Z( ����?������C4�ݻo�욞�7������8�Y��l����� ��շ8[帛�`�n���۳#� ��tIݯF�n��A/)�3H�<-�l�z��IתӉ��D��ؗm���p��(�g;�\�*x}���% �`�m��2�VC�*T��t>��� @>�@��'�
ì9.K"+H2�TO�?�)\�����gCH �4'�� �L�z�L��$�O�C�4���aT�A�
fu5��%��.��}�*A�� d�W �
I�rC�-B������@��8��F"�9S3���&`�� R����Q�O�Ƒ!2��9�t�y��Q� -��qw��.K����+;�1��ߔ>'8	��p�6�ȭ���o?in��Yv���"G��  �7M��������)�}��=�.�d�Uug#��m��'v����@��{ � ��E�"w�`4��s.:��&UD�ep�;� ������ۛ>��m�q䡨w\RQ�]sk�{�}E�sϿ���[t�Ϛ��n|E���"x�7�k׳ϩݗe[f�ۯ�Wm�����HW�q�ܕ��֙�m�rB�<f�����Q3�y��n�d�q��o��6Ëm[hץ=Mp�$e�cѭ�����n[`փP L �Ē�v*[l�V�R4�D��czDٗ�o���ǦG;Q�l�&z�9��D�&X�B�#n��z^
��l�ͱ�tپ��R�㻐=U	�PԵ%� �@���I�JtZ�GP�T�Y�! �L�&uB�R(`��:~1%��2t�	L�%�� �D�,�R��)+��`8:i"),"��҆f@xEH@� u�"  �8u��������#S66��ʇn �6~q˒��I嶶���ۅ�K��po�?�/��sxNbv���0�6m�_��~� ,l3���1��ޑ�fҋL�]-R@��5�y��� ���"��ta��[��!�uow�8� {�70�-�X�j��nu�ۜ�(��*ݝӀ��[~����.��[U�/��e�nV}-����=@Y�^q��KjCo�l
���� ��YtX֞���X
Bc,���W�#�"� J�5\F� O�3TPd�`\�5�$��8�w���$�Fk�� R`�q�Ii �^��f<�� �M3�`���`�J�0V�!U0�q�@5P��1��%I I@�"J��(������!�e�Lb B����K43+!�@�&W	@ �6f�@	 �T4��L
�>9��S�q�0�hQ\��G��7$�.�Q ���Z�i����"ڶ�yri=G�rô����C�qf�M \v�N&��V��]{x�&�Ӹ��lay?�(�����:��o݃�S����j��{�9L�f0!1���Ը��yM�ۑ�.6�׋m>���	�Y�Ԯ]�\��ܶ��-�.�s�h:Đ�J��=��vf���p?a�%��t���k�?SB]OJ�e�Mp�.��wWߴ��9�,���Ý��5j�8a��]��]˵��m���v[OX۸2��^��i�&�k�=�:��흫;�������-�϶�J�*�Tx�Z�{����or��>��[:��4����R�GY2�f#y�w��k��k�=T���ǘ�l٭�q��hi9G�0���)g��v��.7�5���,
�����t׳ H%�WVq�rH
�@�1:I "Bx��("�HT'݌qu0@r���
��
@��*��8����-��� g�R �8(1(D����  ���j�A8�Y�2	W��^���p1U�i��rlh�G��f%�$���Gm�^�v���ݲ�������=�\�<����/m�n]e�WK�^�� v��T��\�|Ҙ�s�^� �ܣrf�6��C@m�<%�8��RU�b{��<m�A�ݦ�� �ˢ��� -�߳zޫ.���� ���ͅ7�Z���h��Bu?-#ʹ�����7�m�l��nX�ű���o���b���wkq�U�ps��1��"��ſb�(o[&�m"iz�n�����=.GB'O*�=Ad��	ΰR�T%G�1�TRT8�
H��`4���&b���D�����E%&��������4��0H�34��)%Ee0g�%RK �A�2�H��
Zъ��+�����H@��)#��`53�C쀉r��F�.��		���e����!JV��@Qq*���+Y�.XL�01����Tk4�P5i�z@�D��Q�	! M L9�}�������۠`Ǐ�uwӳ�߿���׫�"�T�T�(凥���6�o���x--s�Jf�1�oMsSn�v��v���r�o|hݱ�}���$�����;L����۸l�74�ܸ\�v۽z�~*��wHc1�V3���6��ݭ�鵺`{.KnH�
(QfcysKv6��e��c�[.��yp$g5�Uwo��u���e�n^)U �(b�iX��.�/wzѺ�������Ơ)���%i���p}��/����yo��M�ԛVđhK|���u�o0齏ܻ�������q6�ow�������k݃�Z�)��v����o�����x\��\�1��^�%f}A#��G�}�z�-�n��t)����f����F�cf�m���L��sP�p�l� �f�j��/o�|���u� 2B�M�����Yٙ+%�\#���%��`q2��*($D�3�����N�A�JP�d%�)32�%S��A��k�pL��C׬P�B	�h� \G�)�0P�`̊�� HH;���1˦�r�E&� (^�n�/���g�̅butӤr޷��D�o���k��q7m��<�l�����v�[�Io�Wh����g3l���{rT1�X� ށGA�'�͵fh���F@hWL��(Ngh9�ؚn6�X �~�Y��3fcZ�YT8�ֹ[|~���r�mܧ�V���1��g�;v���W���_� ������鹳�� {!�f��[��9�:�H�Ė|�m��j�l����#�0�~Ө(<(�G#�T8�"hF��� 	�*G��
J� ���� �#SQ�� ��NpSR ��)L�
Z�O�p@��«�0RQ)�D�
�ҞTU\}�`.��V�$������<)X. &��)<���B)�*��៰%<���	#�J
�q��E��"9pLjVp;~�  	�Y���E�fN�#��mA���(�'03�z@0J��0j?UOߌ*t�A�F�H&&����Ҿ�mI��޴H��u��f�Ȣ�X�w��� �sC���K@P�!e8�w+�������ׂ_۸;�5)?�yG~==Y�f�����軪�qk]yH���:O�T,zf�n�Y��{�7;;;;�m��usA2��M0���-n����k\����[.4OhU*f�"�<��\��7�z�ۛ�i@��\�d[���٘N.��E��m�شִM����W�9�mk����l�Vߵ��u��/�h3�%�S�nq���ϴ�~�k��i�9���-~���U�͢q����v��ⷼ?si����}�m�=��\� [�Iiq��-��6���~N�녏�-\��(�SN�*�Q�W�Wu������ԋ��4&*c���j���!�w��R,7W��,������:���c��54�˖���X�'��<����4N=d�ǭ�UQ0)X�(�%s�� �>��)S$N�8:��+�H��-5����0���J�����^�� ��Q���>��2A��C��Te
A!�g�9�9��X�T�d�����#K��h
}�����Z�l�}� Bշr�����l�U�H�<�\��/j�7|�����^C����������F�$0�\f����e�VڌcCm�S�=S�Ψ��y��(x�T*'���ױȠ���ָ/�6ŻwW��6nD(Ϙ^�����?�к�� �7'�J���~��M��e�<5�t�-�+d�CFk=9$t�U�顛��Ek���]~Ԍ^��-��hV�ޏ��j���I:���F���`AD�"�T�$�yE ��ɑ�}���� HW))��5��~� f��~p ��ܫ  *�@���s�k�	���*�H���X(�y�z�5@T�:�DȂAC,�A@
R��8{1��C�� ~h��AH�%0�P��!�1��U��pD4�
�,=�M
!�'6��&`��@��D}��h=zt�0'�AR�*3��ɉ��ŗ-ǳ���lQ� �5-�&X͙�j\W����͍ۏ�mրyn���$s�
�G���ϝ���	�o|��>cÚ��JpMQ����H���1�{�kZ�}���L�jc�#�P��npp;@�;�
H��5�wf�c���{\���A���F6㕽v�d�w6�z�1�̼���*�IIB2�<�q��Ҳ֙e�A�t��th��qlp��Foi��q��ͦ�: {T�nr#6�H�xm��;p�m��a_�	!��A�8�K0޶5nv��X�M��}*5=���%g�X��6ɶ�چ�m/}�|J�JL���卛����-iG� *7��h�#ۭy��_7� ��i������E�!�/�t\6F���&H�#�q޷�cx�W�y�80��<8��B�ľ��;C��:G={��8q �8-#��@ԁЯ� I�Ռ�R�e)Qd%U�8:�ҧ��C<� ҁ@@P��j�U'P;:;�X)����U+B��PB���Ϭ�Le�b 2��ETk���t�)��-�\��S��8|�^�\���j9�|�W9=�۬�����S�
@��휛{gM5�k�<���:6���1���H� �i�D�����;���o} � i��I|@�"i�Q@ҕ9�Hn�
���v�~_3�{B������.���<�ε�״T�s�w�_&��v8	����q��-ߌ��f�ᬖ�����*{�>u��������6�E���Z��v�� �Y2������\uRRYGD%G�Q QEL�u�E�ȫ8 �Ģ�JP�j�LV$��O���RT��,�bj% �&�ɑy�-Zfh~�A�MP98(D�3"  ��-`�{hl�1%�J�bn^�T�2� ��jBP�0� �2���Nc1�Q�P�P$�?�!P�Tʙ����@I�2"����V`���3���H��e9�3�i�V@�	H�I�Ǥ>����6W9M�?�cV��㛼�;���Ƕ;�{���f۷�K�kU���r�g��IA+_Lt⾎�� �\�q����_3SI$��]��G��5�#��{�4 C���T��V7у���I.P�����}Ø��?� �Zd����Fwe��9��u��kMB΋�r�Wikh�;���t^��<,��.#$�n-]uڷ����ڳ��46�/���ʥ�*�c�➎�t?�n��n�m���Z�!���A_8��q�a��]�{����KZ�g��� 1x\�F�g.��[���͒��݊�Wm�S!��,o��o;�Z�r��ikZ\�P��-�$��>N�ͽ��n|�۫n��s+WxZ�E�"5�0iq����Ƚ�[kCi���̶QI%ʃ21�9�,�W�a�wr0h@ � �$�K ^i���)��puIR��� IY���R�� �	
�z�}<`\��#.���&`	����\$�i_��
y�T���4�0I�����˶����;}�;� ���f�O�I�&�g�� N��~Niۻ����r�u�_�.���� Z�mΆ�d��F3����nݦ�����l�bq�ǦL8URd@2Y�F��J�&h:�B�)D��H2D&�>@>�s�WH[|��wǸ_l��'��廦�.B鵺�>H�]�F��� )a��=��3�;��@�����a#�m54��s^
ѫ8�ӢN�v�r�{����nl�-X�f�Q�tMo�O_ɑP%@Gw0j
zq1B�����e?�z�r�9�QQ���$ ��@)jG��YN�1Q ��JyE%\g5�y� �&Lĉ���	 N�$��9UQG�8�UTR� C���H2BP�`##"H�<r�娀��� �fd�qP� �H�`�H*�d��,���� &���T�L�����P '�%�`"d�#��J�����"���<��	L:���!"k��@J�+�T�@!:c�����ܮ��'ۖF�/;���s
�bӞ�i���o��7yv���]e��qp9� ��+o&�,�צ��w�'sh۸JT�J���u��ö�t�&���ETU�i�gg��]��#��Q��)�>�;�?gg�����ҩTrcH�v��1��{v�^��(-�@�T�"E
��wgI��Y�9��e�%�~c���d��m�c��,�pvc-|���t��l�nmT�h&NuR�׋�ޕǓN���jq��_k�p)��=�JC��v��w���\����m1p(�n�g$Ǭc�gѱm�߻݋�.l��/��[��`R�qe��7J'���7�|o�� �Î���n��ݮ�{�����*��j~�ye�L�ڸ��@t̝V��m����&�� �L�p�����F�E&��(" DD�� "S��u��Z�yL	�+ _QE��@�H$a Hi$��2O� Y S���5
�TQ��P2#� ��P�"E)�E(��h�.�I��3X^c�|��/�;��T-`q��c;_Ov��}P�.�����7u�WY��Vq����	=#�:ܽ�d���i�se�6{66��
i|¿�:����zVJg*�/��(Pu<�cH����4���:a g:��@`����ی� G�����'{�l<���9�vu�uY�k���� [�}�Gn�iu��G�����n6nۻ�q�b�C��+I�1�3W�.ظ֪� {#w�-W}~�י�N��b���f䄝�BۭL��r�����ll-/k~]�����sMu0�?tzc�T'*UX�%CY���(�2= ]_H��� M$R~C�JB�'� B��Iĉ��I@ 	��RB�T� .-��&(5KX4�
���p�e:���DT)a�DĀ�Pą).�Q�A,C4�̨� 3@
S"�'���Vu"*L��+ Lbdz�?JS(	"8	��9I%2��T(�'"H�e d�y�@'	�Z�$�DT���O�S@��P��� eIE P� ���A�w�����k7��6��.^c}'���"&=��l<�����\��}���m���>f�����R�Cg&;�e���6\��N�X�Zs��� �}���F��YS�����\�X\�m���� �!!
�|q�]1�ke�l\��U�[d�{���
1�a�����l����u����/~��0Q�N�羽�uv=�/��m�g����_�ݵ���F���ǯ��.��;�qop�B���V�\��u������G+r��j[�/l��[��Ә� ��ɍ��֢��ZI����:�?���댽��8��a�e�&n9	8�;�Z�м�hI6�����O������1\��˻}���ͫ����-9����}��
Z�*��=Y�c�� ��=����9���gʹ����m�`t~��4�{Uۤ@4���;G2(���>����S��@A*(:��f��|`9~��`l���v���O�u� v��}:�%�c�����=��>�}?�M��qŴ�� �m��{�
KE��@����X�l�6��mխØ�b�.��E�J��,�e��!������I!y��(H�,�|�(��$�I�Q$��U���1&����<�Jz�00�0������N�hㅶ���}�v�W�����C��|v�ǋ���m�#M�����瘒a��v�7h6@&�-�� �eґ�LG����')��+'BA 
�<�N�P �RU2RB�xED��1Jagtm���cl�����u��:����"���cz\YE�o���ԇm���I�/[���1�ވvN������$_��n��2!�G�Q�ڋ�ul�|�s�Pcnm��n/v74vJ�����{B�ݣ���IG,:kq[O����݇=�	c����mO�ט�r!�ǩ��� �y�0B$�<���	�"(�$��Ԋ�x����'eA ���M�H! �h'�"	((&5�(Z��(�RR"sE~U%5�E�2��p�	Ef��H)j��A�W<:�53�s� .����#�MV�H�0��$��P�t���'51P�\M �(NhD8H�@�� p� �2��`�fUVK&�p�U�,P���BA��T��A����s(��M ���i����L�ЩJy�N@�4ԁ� @@�8�D������B�}���������q���x�7�hl��O��ѳo��r�e�W��z>K�Y��[o��&1�3� ��oq[�����~�&�F��5���C�6���5jԑ��l�X��[/�� ���^�wv�톴6��ŧY�j_W̶��L�^]Ϧ9��giYv��7l�Zh���e�%��H�R�ʬ����M��}�#�/\�mCl��n8\p��C���?NOV��q�;�w7����_�l�;;/���li�9��n�g�8�,�$�̎���M;k����{��\��ot�9�f���a��x�"�zBo��F,�V�kv��j�� ����k�l���r�t�J ���Fs���+esmv��M���Y;�Z��h�27������Mg_���;��]�O@>4��H�(hS�SP���3�TP�CY
DA%�9E$)L&���Q���8v[��n���{����v�/��l���087kj�.c\4ܺ�1�vt��{n^)���\� Ҏ��{[��\ܲ����B�%��:�&�Á)�x��ǻK6�>�mv̬��ϩ�~�w�ןܵ��~Z��rvK��v��-&A���2�\�~S�x�����⾐q��Ǘ㶜�|nx���{����F��0Q	r՘���EgSL|=�Pˎ^p� �p�2�� QLιg2�S}`)n�9��mWﹶv����/����mq��D���;c�o�8���S�#��	ݼ���D�t�2glzG}gL��J�r�ћk-3i�Zm�!q�w��n]�� �I�坮#����35��㫂@�6�o�DR A�Q��"��P�O	�Z1�S|Q&�qc��n4��I���h�sx.>��E�7q��nc�p��| �3��h��.w��c�^����<�����������*	d}��C�r7�;���4���ˣK���:�iD�G��p�����<=���\s��%a����� �����AD�Z��#V�g\0����c킢��c �tz���"A&Ԃ��D-e�U(, q���"��d� �~�"CYg!rD�*�Q��
���-DQ:]9���Z�< &�Bj��T���&�>s��`�R�bs7g�	�
bSOתg
�RE|�DJe�����H��IR(rP�? %R�����U|R�i ��'��),L̠	P{? 
� �BJD�����sE�k  %H��	T5��4"��A������i��x��ߌ��~���}�һjwˍ�ͺ��J� u��8�]v׻��-����Kekg�[4�oj���������aP��N,�b3eY�[;�ڿ{�㭷un�a���:�.J�!��&mxwX�� �lKl�m�<]�V��{M�Ns�_a��I}\�a-���B^뎙+<�����˟�� ӛ��)Kw��4��(��X[�|.���b�2��n۳~��ku��w���z�n���9�-��qяQo�h�^�Oɷf���q��~���.`�eѭ��RkS=� �W6�2��|��m��m�^�����	4���j���WuV2�m��hF���#x�f-��R���f�OZ�� )3��qDK�I�I� s���i8K�D.��J���6�m�>���Շi��V������>�}#�������Xm���ؿw��0������8��x�K��N�1x��Գ/�}���w��\�c���w��nx}���c]��q�c�	�{���q�ώ�q{>�q����e�����6-^�2�C,\`u�ƴ  iI	G�w��FDp ��%'e"D�KM�@HY���8 �&B�8����su{wd��]�!�����}�� ��X��9ˎ�������j�{X����Э��\�W���n�u��Y�l��l��lXӢ��������߾:�1}�k.�+"(��P-p� ���*=���*�)8R����X��q��ð�k�c�K��M_F�k��h���M.#����oW]Uvn��~r	Fr�]��O�u���d��[������خ �5B�g�	��cyd�V�I`�����(�jG/����������X�Cl��u�}�Ծ��ǣO�f7��ˌm� �<#r�.(H#6�ƄUJ�VVq�*�1��*T��=| sR0¾��B� g���J�}�G8����ٽ���>��mw�M���{�����H]��F��%�Hc.�r[��'3������ݧ��mջ�B��ۛ��J��0@���o^<���k���-���-��� w�kq��Ӹ�v�l[Y@�P
�Mu��M��� �������߷ݷ�������.+N�n[��:�>?�Y��c�}d����Mo1�<֍ݱr��6�r�ji0+�G=���Hޚٷ������ �W���k��j�&�~�sq�ފ�n��`ucϦ�?��ռ��:�e;[�3����Xڼ��7�%�a���=_h5�-T�ﾚMs�<��mǋ���ww��w���l;�퓻�v������g�]j;I8����=����~�m:�������<���~��N��?d��&��琡�r�X	��Gg�9<�Y����c��KZ����:�Zg��( �#��a��S4���zX��G� 9:�L�Ȥ�8��i9x�UC/li+�F�˘5�� �&�� )S� K�E*g�3 ��AMJ�Ih D�:g�P&1EI*�M'TFmw� &��J�D!�@Z�������l�_5�d�/�[zG�3t���M�X�رm���ܰ��-xsX��H(^�����J��jV;��������߾����_fշ�u1�yp�N28ǖ�;ɖOk��nv�%��x��F^�sf�օ��$�{dI����旾�� �n��6������� �{���-0mĹ 32HߍY�_v1�r�Q-����wm� .|��Xo� V=\z����p�$O���	Gm�����&�1�%+1?� �(�$��0(R���ERi1C k>���*���p���Go��v���L�Zshu�ߊ�l¥�=��O`Rǵ��z�5��v��kߝ�6��ù�E��"Aۇ�,Q�tۢ��;���hnG�.��N��>�[�S���Z�<;��ov��f��+!��S5Ol�����| �2�q��H��r,��i�y���=�ݰ�'S�d1)�o��ɫ��w[������y}�Gga�6mcK��Ky�uƤ���y�6�=2c5�������V7cU�M7����wqq���j��i3����6��b��\������k�d0�ԭ����E��_��$|``���A#�, � Y�O�b��$�Պb %�QQ?�Y����'�����L�����E�e��mu���4!X�oVմ��c� 䬕NF8�RpT.��e�b*�ݶ��t���?PQ��Y��f�wc8�;���l�$-܏ۿ[Y��*��^�M�\J�n�ǆ�w6ߵ����w܆��[o�,e�|���?���O�c��?/fY�������S8���:(�g1pd}A%B?�VKY�?���R��s^�B��"���P�`%Uf�%�5���� ����T�>�:H(=��x�h������ݥ�i�n�����YvۈC��5�z97�n��;��2��ۇ��[m�v��T���{h�ٝ[���v�u�g���f�X��^ֆ*5z�4�򋯳��?���g�^�m���MN�ϝ���ҡ8��1����l}������O�[�}��b��v-�����WVG��e{t�m��q[.����<mw��1����M�e� �M� k�����za�/��l;o��/���r���8�����7�wnY��[a�j���Yu�z�����#\���ݦ�K�=� �>��v�ӹ�}��k��)�se�ܴJ&�mp���֖��$߯�������t��֓���nsW�����]�j�{^DzE�?��&��&T�o�;5�L�=V�Hw�ZJ}c����q�)8	��Qk��@"U�æ0PPU ��� d�<�H�ߦX�吀��=M���P߄O��Ƅ��dQW<�0��&dɀ��!)��	_��MJ�3�QB&r*Er?�j(�@I~b+)A�r0\%�R�Ƶ�����+&���MP�1D@+۫{;7��H��u���m�Ot-��\'#hX�7��/on\�|?Ҧ���4�|����!�sݶs��ۖnj�L�O
EӿVw���-�j��J�����'`As\��z雘����F�� r����<m�������ǷO��x�>o��L���
	�N	fV����F�@ ���$��+� �*$�B$�*NGSp2�pէ)�pl��ǐ���NE��͓]��U��E[�W`�M�6a��z�|w��� ���o_��,s��-��n/��$~�M(�������\�(8^g�;�o�<&�C���9���m�������|mjs�8�U)�q2��>��6[n'c�� ~ǎ����AG���m���5Lx��\Z����b*E�#C%LN�"_4*J+0F1`J&Ue��9��ۑ�g�,��B��p�f�uov���^Z.�~�m�Vb<ܯO��L���[�v}�ɸp�xf��<�?���Xv�^�-������^-d�t��]��;�j{oi�Gl?��������`?,l��\?W�d#s�q�f�V�s�;vػq�� �gm�n�ܳ~Ս�{�Zo>�	5&5����^����^3����O%���so� /���m�SY(�]���Y����w��X���������� Z�i���t��1�����lmo�W���Ww�{����.8��|�z����RNZ�)��=����f����cv� �-��y˥��u����a&	�W6s�6_����o��,�q�n�6�.Z��nZx-��A@�X����}:�9�������l�[-���Y��7we�>�׶�X� ��r-Y����3��?m��͝��v6����[kf�ˍ}�v�κ����m�zW[�����5�}G����o�W���p���ݴ����co[ޛcm}�̷u�@�:Z�*K:�v��o'���+{����=�y���k��q�ں��c�q���Z��QQ:J�?Sn�[�i׷��ӕ�^璬3l�(a2�w�9'۸ݦ�ٺZ~U��e�)%k�@�4�X�� ���;N��y'�uϗ�����<���m�]f�2p*B�)x��k�mq�4>��q�w����^����xW�6��=�o7\��{����Y���כ�k�T5�J��1es�ꖖ00�ѪN!�)�
(�#�(�!D�+�=b��Z�R��C-d΅0�(�q@	B�GO�*5�� ���/f���>}�m6��P]�x#X�TR��f�q������<���.�]/z\���{KI
I���r�ǯ~)�t7��s�}�^7;�z_m�m���O-W���鮬���~ͻ-���sz�p[v��"8�9ϖ��A�}>e�߼���wh�9��wN��:�IPA
�V�)��ճ�Wbp&�7[Ǎ����˖m�km6@����'꾋���v�<���;NU����2�˷y�@ѡ�� ��ɜLÏ\mo���n�}��:Ž���O~�l�v�����V����Ǧǘ��O�=��'���{���Z~� d��q������u[�ٴǿ]�J��L["��/e���밝�۽�q7��nct�i�ٴw�J�斥�9���	H��Z�׊c�{���v���l��`���V[��h�M�� ��#�#�r��)�
�Y%2
�8}��@r(` �f��T��*�jE����}�@�(D���	j����TIA��|e @ "JG��	t��p*AT2��-M%D��**5��?d�����@IA(&VXt��)qäj1S%g�f�QD�T��Y�P���^;an�llo��� o}�X��-G������ۏOZ�+�;��7oa��j-���7�(�U�5z-t� �=Źv�n���[+W�<#���u��wr��{�a���۳�2���]����"G]��4��=��������r�6n��>]��$2p�}-/���^I��zC�q�Ь�IN5�w%��R�c*E�
��	�����$��\j�$��J�%���L���	��^���.ϗ۞����s׃�<u�om�:����a�!�8�	%"m'���\o�o�����������?�g�����n ��Ֆ��,��N��}�߃�vGӾ��u�����)��O�o�9��ۢҠ��\W�s��{mv����ĦO��t�)i�Brf�H��:�	�%$�Ew����䁶�[u�4hS��we���u��M��ynݷ�;�[��n� z?��c�9�-��A���d�_��C����m�_��r|��ӵ߹׭Y����^\��6�WQpqr��פM��z�im/põ/\�� h��m���?"�v�.�ͳ�-���=�:����p�b��S��������w��#hr�Sn�7�ۻSu�u�)^�4��0��ʪr=��r;�S������N�r<n͌���X{��.�5
:a�
��7�;���]���G��ֶ�3�����6�6�7&l�h4�U������Z� f�;��se��Op�w�s7�_ț�6���F���hcZ0�yX7]��^�Ƕ�r��-�,�kq�7z����XK���&�<�Wn�����N��r���n���Zg˱iKmZ�55\\}D��1dKQ����7\')�ٻ����Ym�Zxh!��{Z\k�T����k�q7w����\�r�����m[��{���v� `�n6�P�I�Y�ep���mp7m������<����i,��\����1�٭v�պ��|C���9�2ۜ*qh�p��p��Z��nE����w��e����4������� ��{�uڞ�P�
MG�կ��
���e�\�^n��V�Q�>m�?�4N7�ŗ��c���$���l�&��v9���4~����|M��� �=|�.]��	��$U���5:y�>�)��d�%= �T("�x��gJ��	�� T��3��8�m*P)JEG�����w.׶�;�[�l���.F��W\zт1:����;�}��~}���� "��p���
�C�۾��-���m�{+��A�,����'@I�)�U�?v��ui���7ii'H�Ԥg�Z�Vݵ�~�/��и렮�P�wgņb9��l��u�\`�zB[��(�$f%JqGW�q��"ի`��Hu�,/��Z�ěA*�����^�W2���lC�-�ݗ�o[p�oZ�iG�N9�ݹ�z?��6�������n-4����^�[�4� ��nc�o��k+�Z6��3���ݾɮFn��7\���KJL�JG�\M���c��?��]�˲8�;��l�m�mw�mPXD���X�/��f����F���
���pSP
�t���^��Xf:H =B�D�qZ�	�� ��Is�Q 𺜪)�Q Ö@����EZI�Ck�$�����VqD������xS�FY@H9Y� ��(	���I��$���	$�B{D�˔��H��3��n��X����ߺճ`+�8	(3��U�KZ7s}G��ٿo۷h=Z�������slqۗ=����Z�[�7���x��n�2�q}�Vn9�R��)U�r�f
�i�6��� �n�����Z�Z�J���u�6�����v�� �ƛNhY�Lp۫s�6�G�kx���O��p�F��owǓ��'�v�}�.e��g���+������^�>�J�N�ۻ�]���6.pҗ����m#��s�a�~ˬ'�9��8P��@A�*�g�@%�!��@%�S@�����3^� P�'H�?K��yn��n8;��_�m
L�]-@��o�\k]��=�B���	��X�P�Δ�Ht���PhP���Q�J�'�I.	2
t���.��x��~+s���v�w��M�Z��ỽwmm��E���� �d
���}�-3����w�ӽ��jY��ؼ?��=��v׭�ˑ�n2�E]�ΚL�s�����&w�Or�l�y�|���,�
�s�@]�iɱ�X��^��@Z��ni4�`�4�L(8�8� q�
$E� RND�A���ҢD���e(�I��Y�/HCU�@$*)�Ϡ�	�v�-]ټ��c�;T�tq��8/����Wڜ����۹�9-��h�6� mq��nho�Ký��6��t�G�\O}��!��6�Z����B��k�kp�W��ZE��P�rc��]zWL�\�|_ci���k�>D��\�%�_P{#{���n��'�96��rV����{a����&�>�
�5�2�v��a�~���6� Q8�ָ�����3���۾ۿi���p5�/K��q����z\��i��e�﹮}�n	i�>`G	N�SO��*"@Ԯ� �r��@ ��S���j��@="���V**�	zڏHp)^�;�߸�� ��7O�� �����*�n^��BUXi�c�m����}��Z��{.��e�^	s$IkY0�w9t�O/�}��ocb��ص{j.9�a ��M�ْ��i�M._�v���f�ۛ���n�����-�B��E�5�;\V-���y� ��Nݎ,cJ�ǖK���C�ƥ��x���З\����8Zo�ˋ��� 1z�k�ؾ���,8�[�Z�\����y
	�o�|!�y��,7�n[�� �s77�ޱ���^���~�`(����v�����n�4�m�����������s�]7w���u\q-��7U��PL�~)oH��Ƴ�[�������s���;�}r�y}�{��,��r4mvų���F���ZǮ��6̸�Av�=��k���,��6v����e��kހG�!:P
�a���9��{����\�0 ZqQ	�(Q�3!�}�4��W�?"2l�ԑ�S@A+���IQI���dʗLK��8G!54$��g�\:@H\q�\�R�Y�S�A����X	���`T���}��v����Z���^Ϛ-4���L�������t�L��u�;���'�ݼo��՛{6?��`�@x�1��i$�Yl���c�aq�]s@"k2ꎑ�c�*����M%��k��e�&D�q�g��E_��tv�QA["�E �Qs���ɿSK�]p��|v�#�J���tl��]cE��ې-�l�R�}���fv�9�ַ�I�O��[�Z�Y�{�u�^xt�H��zGO-���X�l�}ñh���ݶ>�5�j�B��c���kҹm���g-^f��o�>�(�"=R�3{0d��E�#HDԟ2g*, J��g j '��2����WҾV�5� �^`���^�v�KJ���A�wp���a��<V�A!��m1o��װ�:C$�(��*�K�0Q@'��D���*�P��H������� � )� i�+r���C�}�۝���mY�vW_��6�̹�ߵ��m\������=����d��B69o����1�从���{��흳��������������e���:��F��h}>#w���I���Wl�{n;i��6`3i��;�5SE���s�X�U��L�8�r��u�B gJ�P��A�$�HԞ��N�����dR"��:�ìP���\��)�)���H�ȘT�(� �!>����z0�߰������9}������v�n���紼 ��zu]{��ݟS>�� {�}�vN���k�vo��	��{�[ߖl:۞C�cZ� �KnF��3�i?S�=���o�m��%eۦ��n��M�+�&��6�_�z�&c˯���w��\��~����ˎ������� Ȳ���d^`�`l��nӥ}#ґ���~����v�zw��f�\��{���]�����k�ͭ��ٳg��ņ�5η�\$�)(��z3�����HT9����P�րEg*d���J"���LPE�tkC��H���51�� �� �2?�<���/��=���������s��ojsv��a:�M�Q�t��kf0�6��3/�v�,��v�%ϴN����!
GL�̿{<��j�n�8��`=GU�R3��uד��G���ϴ��/:呥��B��)C]dg}�׸����/�^��J����n:\܉�.�٩�������F�6�j������ 5 H-#˿�����������7/m�n_tE�p�x�i�i1��ׯy�w��Ngy��>n�ᳺk(��c��v�opz�4�ǗY���zv��>=����~�r�&��;�c��X��׋��=�>Pr�_-�E'�r��ix�3nM9�}���;��5�;��x�����ͮ���/m[p%����A�pz�����;r�ɼ��Pe����D����Z
�PA$�&S U`"?�@���2Y��!J8 �O�
Z\L��2�!���5 	�|�`�\�IA(�CQ�A��T�*�+D�Њ�5�$ �")'� �&���z�pn[���(&�s��~�r�73���lp�m��!�u�� � *��=���s]��{�;�����������~a�\�PI#�te8���ߑq�cK�q��4�"Z3l�~�����m�����0R���e�$���:�r:cB��$��}!��]����j���=��� �:��*)X��������%�����!)Y]�n�P� �sVHߘQY��k,������ށe�'TS��]���}���<M$���6�˶�>�� w<�k�������/��� ppm7��4���4�Sג
F��V./�#��I}���v�[�3pH��AR���iɞ�;�̀���=݂�Iv�'� �;f9�6����jB��S�a���ǅk�|�Ub�i~�Vy��g����]��?g��-���kn��՛;kcKƋ��=���{<%�Wc�6���⚍����-�So�M�{�!d�v�c-p������]i� �q`����x3�HyS��;����9-�i]?%�A鉔O*��O��<���P&�̚�q<��=��>��f�$�]` P�/�<g����m��R��8�S��;e{~�|��m�շ�8�ƹ��i0��V����jv��<N�mg�ⶶ�{P˺K���y !s�I'3��,xOfLs�����kO} K�ji=���V�����/��Oc� ?�)� �V(��)�/��<'�����m���ڢ�3�j��b� =܍�嚈�l���x�d�qw�I�S'���yT��{���K��#0.4I$O*xOe#ܝ�Z��R�vZ��N�J5�i=��?p��J�="�2��O��N�.�%n��l�D�3��O	샻��H%���qQ5�Q�E!�I�S=�����Zu(zܲAiXyV�"��/�Y�skn�����]j�l�ُE֖�A�dL2��������so��op���[�\���r�Ĺ��ڷh��{��pA�Q��|ܳ3��9���{���w�p0�{�onņ�_�m�Nf�M��l!��31&�L7t�������?�f�0�m�K�g4�ʭ�Nl���P��
(O����{*�唏���1	3��)�=��~R��-��1�z���=������&�)q��i5sS�{#� u��2��4�r�i��J�3W�{"{��F�L.i������4���>m�	���_�0x$��|��xj��3��c��s^��l�wC/�k�C�]b��{Z�u|�Z�%�y/��O��PO�ln�?U�ͧ5��.G�=�����ӾF����Ej����F�J�Ӿ�v���^A���Ժ��Q.�d��~�w��mw
�	sí��*V��u�����kW.ڷ�]��pe�m���5�j�##�f^�y5���ݮ���/!���,`P�=R2�{q_v�<�����.Clv��c���-���n5��u�5�4��٩�<��;��s�}8����y���n����������is� ؤ2�d=��ݫ�u��wg��\��n;���c�|Y��Tw��Q�-���p�t��a����w{�Я�i]N�4)Y %d!���?���C��A3'r��� �5-_O}l�qwq�AS��%)�N�ď}q`�M�ă�kf$��3��+����f�]ϴʍv领�.6���H�C��� �NѤ�7m(i?T<v��"��������� �����z(��/i0����5�!�~�:!԰�m�S���S�\{�c�r;�uyF�6��������۱huo�*��᷵L��C�-�����?	��DĤ>�����Qw�?��-k��d\I �u'$mKj�S�N�կ���{�f ��DӜ_���<��Z�����������.�r�(�}��寺����7��t��h��̕d_���寻C�wGa]���X��}�r�tڹķrZ�U�1����?��I�� v̈́#��\�d��t�%q������}I���� Y8>2�S�v�����wlTz�}d����_O�S_vr��[����}��m�C��oۤ�?�q?i��^M}����\�b�A�ހg��j}�� �g�h�����^B� G��"_��b�����L� %8@�X�9�f��q�w8~�t���f� '�{mkm�<��[w0j�we������>)�/
m�w7[�ǲ֐
��C����:�g�K�[sn�ݸ̏SX����c��?q��l;�wb�h�[�Z�d0RLk�|��WO\������ҸZѢWXT�H N#_��������+{�K��;K�gt�P�/Xh �����>�ox���ڨ?�;�@[ٗ�.�ڑ��n����x����N��{h�#��\]�`%��d?e}� �}y�Pw�i����d`�2�J5�/�_�?q=�����E�c���z�.�^�Q!IV�� �}��6Kgl9��W��{��zt|Zh����>CO��8*BJ��"�b3�ʐ�����'��g5�gyT�z�&��\
�q�B���S����~�I4���?����W���=;������e=XC�K������g�8ߺ�Ea���G|��nZ @�z�<���O+��O�- ����qtW$rC�{/��L�ܖ�[�n�h:���?���O�����W�k�#�'�ӹ��fL��Y��O+�n湰ǯ)�r*n.��}F]}����L�|�qw�M�ɓ���TՔO}����湿���7W�*j���_h�{{Կ��z�n����W~���'���|��/������7(��:�5�}��ΏP�7� h����)��/������&�q�-o���KJ~��J��}�y��;������?������a᯳~wܿ�.���r��b����!ģ�����'�����Џ���D��.��Q35���������Dr�ܜ�~���O�a᯴_=��� ���� �m�W ����F���_�y�z���ϑ����4�?���4�/�B'��Ǖ�I��>�O1�sR���Mfat��5巺���&�[zh.�\���CR)���{{�]�s�*y=晕;����Ua�=�;���h���E��F���+5B�i�{/��C��.Kv�qvdQ}IIE���ܸpw���T-��|]���=�Z������N�>}�BT�9D��k$��  ��������~u�:B�����L�7{��_��8=B��3#W`+�ԛ��<0���̽p YN���w;�Iv�p�2�.� �����n���������T2��P�Y�I���^�H�n=�Ƶ�<b�Suǹ����!�r��
���O$4��F�n��=V��|���e1�����Z����.�xY�g�5��X�X�A$�q��Eg*MM
)iL�&pB�5����2
q��Nj�� U�WA��!��?*ߨ
�f��EeP[۔wʶM=(LFr�Csv�k��դ����Z ��z�ZZ �����6X�Z@Q'�wM��R�".ZH�FA4�p*��XeoXv�KT�52`
@��4ͫ0Г�k��I�d+���%�%�1Y�����"AQPcA8�nᄂ[�A ("�**#s0u]m�7������ZΟ�y�K�/��55hg������Ak�rSJ� IF�d�p	Y,
��R���iME��iRRtH3�v�5��d�1�|��C����QIR&��������в�~� �l�[u���`(��U$����._kM��]UFxb*e�Ǹ�s��=��@"&Uw���TZZ�&DTT7\�'�p�K%=�2?(
������:�\�L�N�EFl�8|���T��wR�KЂ�Xq���ǎ7t�� K�/C�0��b,s�kAp ��U�q�������w[�q���`�{}��m�] �.X�A��[r�Z�d{��ջ��廆�t�w8����7kvۮ7n�E����d	�9����� �E��p�A>�5L$w˖]���NJ�����m�=������U�gȼoZ?���ZT�Q#��Xt����/:݆[:�=����G\ph>KX����W���=���rqv���ínu"�3�&����xU��$���w7���Й������~'�S� �Wy��{��)�����~�_��������-3!�r�F�~�_�8�g���b���̻���8~�_��:�� �� �<�H���BT�=b��_�?N��%�Bi-�0T�Ď����}:_�N��K�9n�_�ߑ���������� �gԖ��������+/�?(��4�����Ԁ��U n/
Q�V���}:G���,.�xp柌n.�JMm�D���N��)}L��q�nn�>v���_
?���5U�� �$nn�$MV����_�Q��N����5��ٜ����J�� �?���7�C�)w�4�� ����^����,����*���|�T>��]-To�O�P-w����� �/(s� ��/�&� ���w|A�d?�OO"-��/�����-�p�$������� K��/�H� >��a�q ���\�a� H�����&?��R���Q!
���
0� ��_E�T�O����!�q ��7L�O��|O
�� �都�x�$���x���Q?q����L��_.W�hDܼ� ����>'���P\A� 1��������a��Z�Uo�#�����XL�������8I��~�Q���} KV���RI8}mL$��7{�C����� �D�:���O��5���]�;�<M=�>��_�E��]�\���r)���F�
�W$t�Y݁ z��k��yӗ����p�m׸��6�o6�]�Z)�0��k�nظvo�@y?����]�?��,_��v�a~���Z���	/c�G��rےkp�r���� �*��&�?�p�d��1������G\�ݣ�P;;�M��:C�Ob��?�����>C�lw�Y�?���;msn.�C	׭��8޼��3��{vC6�g\����	mAI�z0��� F~����y�oyS��xv��7��F�mnu5��Aa����x�k�Շ�����+����������[����wyo�
�  �t���|	�׫��~T��6[d�����x����/���$!�ڊ����_o����B�����E���

D��ٯo�+�Bk�NV�d�6v�^�l>��g�U���� �sܽВ	���>��<?�����O��'����?�E����O� j�N��s$!��-3�-�O�}��6��3Pv�qQ!��ُb^�/�_�c�\�Knr��~��9�����4�+.6�R� ����C�}���|�$?�J +��N�]���$!���1[� o?I�'��^��^�֑>���bG�������N��i ��B
���>�ǊC�?�q� ���A_��/_�3y�_�ߡ�I� ����}�©��"}m�����G� Wj���}�é0'r�>����}�B���8L�t��_�g���x�ͯ�_Il�Oe�E�%��Q7�Wt���I��1���W���PQ&L>�������}5��ggq �~���+�m�1�����v���6V	_6��m�O�?�N��x���M� ����� ��m77v[k{rl�ڗ �
55@v1ۋkoZ�L<���mt<��1���\he2#��M�m�r=�ڜ��~���}��X'W�k]2�%F1�v�5�H�ٲ㘍��� F[!r�#9�a]�v�� ���KM�b~M�EF�F4}±QP]�
H	!������uIu��6�_�t��弥J��E��ߥ�6[����\u��};V�<<���u�^��}3����N�%T�����4�����].F�	���>����q�;o� �aOo�A_]ֵ'��Ǐ���<uŴ���ۉ�m�b���շg{���w ���iZG���Ԉ���e�ܔ��2N�2���0�l�Ad���p����A�t8dg2=Ap�ʮ��DQ<>�&=@-Px���(�T��#PkA�D$�qQ�I��3�hZ"
*E��@n�8��|�����1?��Y ����3$&��|b�QK@3>�"Ly�Hr4�PP%_(4��U"�A�A(k�$f߆R�W�DHE�a�	��H�� ��
�����/��(d=�*`� p�'�>����Z�S'R� Ȧ^0Um�[��B� �U��OWCH��mJ	iPj��L#N�5x�9���%T�(����lQ���C2)/X
-{�Үt�䑦k�o}[w��ܒ,'����F�����^��(�k��l�3o-ʂ( ���f�����5���i.*�4�t��T�T������s�wp5�Bѷr�Ƌ�%t㿪%x�	kJ ��
Qp��I����+���y����ؑ� ^�58�y��G]c���֐d�2�\c�їd��(q񂞯��H��
sp[%�IS�h5
g�į��Y� �u��iX�2�!�3$�Kl2"�:kAS�Ȥ0�3QE�")�(p�MA� 偊�8���L�B�*���� �Cə��
���0�eH5
dj��C�#4J�\�s����8���R�M2_8����#A�� RDa"���Y�@����ЃJ����#L����4���H
�J5Q�ǿ�s�>�vƇ�3�s���ܷ��n�/g�����h��������r��B�C}�g���k6��vA�V.\a���r�޻k::+H�8M(~�95��HYf�+&��`O��HIҲ�	���G���:��Ap!Eƒ���+�?N����7{v�*F١*c�����X.�_K{�K�'��Ԫ��?�og���������)���涛�r�6�o�V�P�Be켓_W�������}�A]|N��P��7,)�y���^b�8����0����������{e�k����ˁ� �p���E�Z�}�\��\�����z����6�z�"��$��)*�eQu��4���A����Mxh 	�*��J�E�I� 	�J ����|�L�c�D&1I����,��S'�2�j*��P(�(	�L�P
 ����:�4��s�P�T8��.�Cz�F��TIc(������4ɩ�LըU�3�q	6�d��z�\��(�AF�%�UPJ N{����.��b�"�Z�p �1�NU%S?��/�����U�qi�S	���i�c �H�?I�ؑ@ �����ҥS(� � $�LX�Hh
f��b�I����/�S�Z���h4_<��N�=�KK�pU+�Ee�[�XY�]��/w��l�)G�Ӵq�޽�'\k���e9�H4�)�q����u��N{�‚�Ĉ���Y��O�_�����3��m���'�y�dV:q��/g�^s�րm��ZL�}d�>��z��y{���!�s������L�Ǜ��nW��E�x�Z�cƣSCuQ&EHT����D��f@RMe�B"*����"����),�|Z��U+�bn��@�ȃ˜d�` �A��S/+DkB�kOtTS#�R�HB$b�	0X+C�YR:5 3R'@1���}��@���i��P͠� L��+��j��H��� �^Yb�� 4����2.Na>�"�*fO����I �W���E��Tf��*Y�$����ο�S��+��]��q��j(�[�����x�x^���ݗݸ۹δm�ƾј@���T��<�� ����}��� �]�!�� kmn\@�GG����^��Ш�X��@��VKD��)*�@Hȕ���t��~i���subѥ˶���ᨾq�\��Tnǚx/%xU!��	G�~��ta��=��W��ĕ��f�����x��x��]ţ E�`�@}c(����O������$��6�e��C��	��˧��g�{Z־��C�#���U�E�۳����O�6G��{�!;m	.���E�kf\H$J^DU'?��I�z{�aS hPCD�N�B!�r��V�
����""�.�~�O�A���,�����"�\�4 S����9I�R)d1���2��i�+Y�A5��"�ER>� ҵ�����3�+9I��AS #���E�`�tBԃ���ćU���C��ZU\2���,�
�@��	��� �@��)�����,"U���1��jG8 ��)1L\j���b*���
�-�EGH��d��ReBR���q�	%�I�����3I��#LS=>��S�F�����$(>�B���F�q��m�~ҀA{@(�QQ�{� #����n�7���OD��>���Ϸz���*濤��ao�ކ���r�ǋ��v���r����;aT)2é��C�_�=����@2�����|������ݹ�d~" C�>�y����u��^��;�5����IR�+9�Xޯ[� 5�~�h��t ���I�ti�}Hh�IgE�&h�n�\b� �44\p�MTz�.QDJLM0Z$
�s��( ��<��"A!Ũ%�}�0 �I�pC�b�PA8�%0Hо��))g쀑d�.�@��4$e��(��h&?�|� ��l�|�G�3UY�UB�Bu]��h5$�2\�4�+�CKB �L�łe@4�Q�EJ�5���+'� ��D�( ��k��T�յ;� ���a�^�1׀I�X�n��������^7�����mps^���{��/���ۏ����%v<����m�Z�������_�������8��c��MY��fQE@Ai���NT&XtH���*� >?��m�k��>�� U��G��Ю1�^�A���.���7��qh�.N��O��>�s�7�;[n5*w,(2�c\_3;vx�o��v1?1�CP�c�;�U��� '蕋@)u�%�j��rG�O���yǲ����6����mV�C��${����׻��m�*H-0���w�|ש���m:���"iO1X�������7:�re�a@E P����Յ���ZJG�&�H� h8P&R#Y9� �K�D���Fr�C" =T"�#�"NZ���@-҃0~Ԍ�m��\��CH(4�Qq4�d�@��E>$�,U�`!r���#�5-R
NG�X�aP�M2*�Oˤxi��f�f $ $�U?
D5�:KD*
,���OĎT%�hYg"�1T�^��zʩ*� D���iQ�i���L�p�AVۛ� j�3�*�q&`f��$*Z�cܒUi �+���
��t�D�n�3 q�eN��ğ�arH
7/�@�1X���~��'ѭ��$,�����(�����^ �������cϿw�?��W�,ʖ�''X�O������;q�w�\QMS�Ǚ�&�P!���?��}M3��v1�� �6�p��Zp����#����´���B���0��j�����`��W���n-�c��|��z=��E䊇�<.�55!��>�4���`g*��"�S�M`!���X ��H�>�"�4P���e$����iW�N�rν&@��
� 	�hv&TEI��օ��J&�'�]L�Z`&�.qS?Rg<sH%"��f�T��E;l �4H"����ݱ4S1�} �� ��23�!��fQ2	�"��&*�ƑR���Y�^���]�H)5yV�{O��v�Av�� (	� � v5��w|Ѽ� �|] �}�nO֩4���ײ?�[�]����:co�mo5r��B�l��w��vzm�Tu�3i�-(�2�	∩�Q%*�&�hr'�(gSM'�X�ݭl\�٘����YJ�IIB�q�e�2��V��{qϗ�J��G���v���  ��ǔh�n�L��U���
F����g����{��=&�7�N=�<�^���{��&�X�鹺� a���S�};�l������� �T��)����N�|XZ�-�>Q����'�v%&I8~pL \�DB��|b	� \�J BS�"4��P�	L(��*$ds����n$��A�PCA���3-ERH�p ��r��}�Y`������5(RP�8 �, �:A+R�
��:RJ1����#I��D�@sO,�
m$�Q�MV�A���ӀBe����L(�_�F0�$�2hIlI���֠�"�d�#Z�%��E�s���2�� ���*��Jb�� �r'R�S�Q�0Z�RE
�k��"�@A�D�"�]�N(���1�OQ�V�iJ�,T���P�P���Q�Q�r��
!#e~�A*I%S�g<"m���V�L���h�4��O��Ϩ=��Iw�HAK�������zG��|� ���b�-�@/�Y2�G��>i�:��z��^y�?lyU�yI�O��D��/vt0�?��ΆLTʱ�>h����F�����$�,�#�ǚή��P�m�N��q]\.�S+�]$�� /���A�H"bj§��?.�P(��jA�BR@��.@⤂�d:aNz�P0�u�oI/\	���ZL�J���	��ra-j������}�>/��sJL�9Ef�?�'/"bڐp�#@M�^�|D��$s����L�S�&[ 偢�+�V����#]��A �$��,D����C� 5j��`𠒁*��*,	pk(@���&qQ[uc�|g#�D���ʢ� ԰����+�����;v=Z�XҊ�NJ����q���6�� Q�|d�6x����.ِ"<�q�֑�v	�9���#�D���L(��T� $$P`e�H��E'(��a�{۷�J�����a.
O�}�8��_vF����E�}�f}W8�xw���\��	p����HWo�!k ��N.�|�/l[� �ڴ�c~�e��wz?�}����k�s��M
Hѵq%0�?w]�8�Ƈw���˯qkJ�Zvr�;���^�yY�ѥQ�L���>k��N����O�-x/s�,�
�LeU��Χ�J�%|��dWaRj�Ț�Mb
�($�*�pT�&2&m �L��@"��(j�9iVɫ@B�4q3*���� *
��3i� �"7�z̉�j�(��
5���@#J	�gB��-�qX�`��J�C 	�AӖ������u9&��%�q "��?89��%'N^�Ի�ٗH�� X�ݭډiYb�|ੵ��B�D����"
��&|W�
`&1�i(�i�baT8i(��%"T��5� e1L\PV��)n=��B'/�@Y_x�J��SL������r���
!P��X�5�?���7q��wp�1�t�cϵ���.����9��l�h��j'�<q�G^>�B5��Ug.�(#��z��#��	sHGx����&9���7R
���׼'wύ�.��y��ل !hYt��/wa�.\6��� 9�8nE1Ai�蓎<� #Zw{5�Z=(U�as�����]"A��>qD��GL�"	0��Fd��>"*�4$9&�,�W�d$�.Q��U>��R�RR'��+���Q���2̾&����b�����~�I�_0T�@�Q�i$*���	��mI7�(5�Ф�:��
F"�	�T��ƫ�PEfN�=��)*{#H��('�񊖀J(
�Mg� A�?�R~��o�a*׸2�|���]�`�9}�Ե�67�ݸ� h�}�>��ww��n�������|qWm�Mq�@�������W����t��6�P$(S�F���'�P��#%�?�?9@|��n� �&�n\BVM�uʝ=�vq��Թr�hq-y!�#W�_�\�-�j��6�C^#�-0�Gl\�d��*�Qۊus���o��mf��e|zǩ�z��k�O���5~�+��N������wv߳�}8���⃥�q�OP ��m�9���6nɼ��c��Bp�;Td,n� ��}unhJ��(��n����iOQĔ���5�ҒCÚ0R�����!IP���y@1'�	9凌_I@T�jR.  @qr�8.#PD
��D<�PVd�3�H���@-R�TD��qTɒ�W:���7���Z�� �$W�p�`�5@R�U UU�����i��*���ؐ%�
�T&�)�5(�#_(�3SBU}3Q�~P*�It�&Jұ+�@�NE�ЊDU5�� �@G3�T+urnuBg��-�jj��	�� '����	T�QFr	�i�{�q�M�C�bİ�*�1��2�z�Z�T�C�;sq�&D�d	�<O�,Y6�\/����&D���4͏�Y }J�C4;��I���#�q���߻��9��ݖˉ� �{Wx��1����ۊtz�(�ի�pǎ�ȩ�t� �����V=�E������;t�q�;����$n$�U?+���Ǜk��?��4}_�K��/� /���\�#�?�ޗ����* �9,��5�X<t�#�fX@I�U.3g?(	�9H�m(���T��ĉH�EKbI՛S@���ԙ�fH<`0TR~�8�r{T-d-BEe6��P�H$V�@�nJ�&
o�Ae�K�A)�,�D@/X$E	$L�QE���"R��� �X	�B`[<�]�WVt��H Za���'��Q!*�*U9H�%����I�O�iW�7_��B5� �V��՝����������P4���ܞ��Z|��q���_�=��Y��˽��� %��p� ���>�y��H�JG�z�
�3��5#)��dƐ�fp�%)��u��9�ȟ�ߋ}]i���TԳkw󏣷g{�E��vۀ�[����שA
T'�x��������^s�_i`\]\��@�B���	�v��������[�ڹ�p��$M\H�<������s���{ZѸ��$�%���r�a�~�����7}˰�p�n�e��v��ˍ ����%�1�i��^�al;w� �����{���F���kq�Q�G�1�q�N��֞C�{h݆��x��A�MË�;j�n~��j�y��ȵ
 ��$�4�by";K�]~���ٵ�/w�/481e 
F<*�E�;+�-oϿ�kh���}�N����o����떜5�\B��Ř��ꥬ�E�2 ~"&T�٨j�y��Z��G T��"�̚�@�x�FC�$���R���!3�l̂��(5)*��Q��^�S ������pIip>��1�$�B:aG��8dKTļ�3�PÕW	HzA'� �$�C4
'�8���E2�5X���	V�SHSA��Ss����Z�B*�������#�S3����`�\D@4s���P��9-b2��	$4�+>�� ���d���!�\Kʔ��9��B���D��3$�9��b�O@\'.�V֮��0�qO^�GX�x�� � ���m���KPȡ���/����������3��?w�|�;7>���G^��u&⁲�L�=#��*���t�*"%[s.8.\��[���/X���=7�� �<���Ii!e�G�yk�n����$��ˑc���e�r��+\}��k�B1R>cӅf�
�2Ҳ0�p�ެ�Pr�$ׁ��
���Umסr)���nT�I�ɃXTc�$�TV���*�xԕLR2aQ�PPt��4UF Ӥ#]$�S�E��ַK�M +^��&�j �$� i/)�t�*�<`[Y�r(#5MD��aOg�^B��zΐTR��GE` 
��^2�Th��iH��Q�T�~ȱ��I ���"%�R*�)a�0L$8+����(�b�� G��="����m�_���п�hU
�֭�ߪ>�����e����j4����٤���]	�Fy�J�w}�q�e=�Ve��
Ε��
;�
F#�P�4��󀙘��D�� �7��~ཡ�~7����a��>�q׻��/�������gXc�m�i��B�R�AM�+���gmw��l����{��]}�{M�㷴��cK�ѭ�B�5��gi���� >�qNa=����"����(P������5á���}7���7���ްuY�l��ޤ
�wRD��{�l�[[��gm��b�ijͶ1�� ��"��m������Z >�5�k�@=2H@'�X/��W�����`�w �\i�-s����2�X��6�^�o������߾�iKnq �ARPJ��ߔ���_������3�_{�=WXֆ	�̜a�^~�3,���_Pw-�r�MΠѻ�B�B���<Htr߻���0M�%� -�,��1��\��-��J��	��	
*%5g��X�ڢ���D�ë5$N���تH L�L곁���U@q��Z"�H�i�U�A�"�� ��jLǄ�J(�1I�� �Ƨ%'�P����	���ǬEA����8
���)�O��쨔��Қ�:�m%#�1� �M@�����=Ni�F����Q/X*q�""�9�J!�O��"�ikQ�(Z�ch�HQ1F�KX����I
��fz� �n$�	�FnN�Eilçp~��W�U��;8��?����
�梲�>���rwu��iĂ�{�4D�<� s�������9�H�r=zG��	�\��$��I� L�#��o +�g�z�p���\�?����Aɂ>���o޺'������h�3{mk'm�~Qϛ䫧���&A@�jL<��=J�/3vf �r�NeI�_�(��q���XLH���S������ӈ�xDm�- &g�QD��*�"�0�
��82���+6.����c�*a^����Z�.xF�3�����hb!�f�IN��t��U�g�S�Q(ZT �l�B"`i�%%�s�-HǗ(R�􉖕ChA	2��1����`|"����X�Hz�Nb.@�a=&R�e�0Y�j=0��PtƑ�^�Rlů�=�p�qc�ݰf��cV��c��K��I�'�� ����2�݅ʤ��u�?���'��u},j���zT�)��uTipC���0f����'� ����� �I(�Z�'; ���3r��&�h���*��ڸ��흏u�v�kmx]����/i�N;o�{m1�i��]7o#[n�j~�H,|ݻ׿^<�=$o��v���o�l���!z���+�ڶK�s_'+����2�H�,�]�Z�n��}���s}?ںM���qL,9NI�oqY߻mu�m��ՎJ�Am�=�׋���%�5�AE��b6{��k��m�� ���b�����{�����������d�5z����?��K�� ����Ֆ��.�m��h\�u�-q��wZ��öۗX����Kj�o�h:��V���5U��s��k�nm��cr����%��gsbͻ���NG��w�'E1��4�tk=����e�+.sv�7��=��]#� ��K{J�Lw�=޿_9o�6v�#��-���:7טeo1Q���eѝ�u����n�z_�%��k[{�[�n,��n��Ž���k���Ρ����>ms��z;�Kd�F�ٽ����Y�]�ߖ�+_&��H����o���ֹ�5j#��3�o��_�� ��'�N�Y�GFo-�.�y��+r�d���$}_�机M��sp�Ŷ+y�nܳ�3y�3��w�7�m�����gix��#�|��J}�'����gM<�s��1ق�SpZUt�cBr����zi?�E���v۽�й]f��@}-S⊑�m6��m�2�م���%��S�����!q8�0����@
��R��� �2���Q�}
���>�
�$x*���:��"�I�����+5>g	FE7�&:�+R~���SII�G���
%	������� 4"�U���	"�.�>#���Q.ip�JRU�*w�]2Ձ5��)t� ����EE�	����J*�3t���V�О��igh��PC�\��7� �jag��P�7��?�	��>��>N��R�� ��:dm�mjn] N8}�h����ݐ�j�H�����rR��2"G$�_`���0iS����-�'�%|����֠o��ˠj�}}{<;ޭ��5�Ϭ]�	��ߴ����Bt�s|��?��6LU���>��OR`5NDg:��*�qJjR�eQ��O�A*%�*�*aST�RV� ����ui2A�X���4.]S\m�KI]$��E�/89�rA2���]��cC�FlVuƀ��J��4����U�=:�X��	�@a���epa����%�����u�.����^���p	��Sǔ�u�����[m��Hm�4��%XЮ$��+&Q��6��_���e�%�ӨjD�ěK��K�y���!�T�aSC�F8zV��Q�t ��D�'�".d�>���I�DN��34�L$ p2?l"�� .6�>�^��� j�v7���e�-���=�/�廅�n�����P?k�q϶~�umJ�;�ڱ�����n��h��� �D|���"NIP��+@p�5زQT�	"t\1&�[�K����.�'��n�6~��l�w�-3��;�`���\���OjŖ��m�"ֽ�m�1�/�o|�hO��8���5����_����q�k#h��n���|�]Z�v�]A�eg�{u�����LÑ�"'>�������m����qo^��t^o��AP�I�TF�ti\�ԏ�ݡn�W���e�M�7w��\RZ��SXyf�n����@����y����'+�[�� B��d�{}D��kxI*Fw�i�Y��cZp�v�߄`�?R��|�{8������W˿�]i��D`"m�<c�����k� ��� X�i�-� �����m�n�f�Z����)�mʛ�^"ލ$� ��l$�� ��O�K��p���^��I�E������po�.{p'r�� tX�UW$���qzi5��{'�]��oƲ�;�gg����\}�&���.|:S�^�"�q�߾�����'���^����?\;j�V����ܲ�v՛>^��Hw�TV=�o�7=��x�����)ìƷ���}�y������㷗K/�.I�hEcZ=(~�����8�1����.ܞru�ߨ�������.����^J�{�8��$�;�e��?���C�v�.?J�Ү��F��/���5���������k#�u��>���a�ۋ�~�\�o`� �Gav�� �� %��w<��g:�Zi��<��C��u���3��� �&��^n�����}�������ݼG͟!s�~���nm��9�2ځ� �*��#��|�|��qY�-;���ɭ�_���[��y��w����G��Yނ�eϷv�?��	@i��2�8&��.�����N�is�Q7����Ѷ�k��f���ڿl�IS$%#�]����&��Vm��ȡ�U�!��F>��k��o�6��\KG��F/&Y��א�wLv���~�j�)5���x�����s�m֑� �p"G�:J��8.%:�c� 9��eI��$\P�RbQA���U\,�/�	���%�ϧ��H:T�qO�4$�~� 	��	+���՘���\i�����PDЉO	�
k"gN��f$�|cH���Һ���@��"+Lf�����(=�bƸ�Pw�&$A"C��Ha�����;�%AuƸ�A�t��|�������U��k�M{�������>����D�49�AS�a��'����UInF�}�qW@u���U���*������9+�DF��D��3��;<ޭ��,��ل�_"�&�6.�F9~J��䶺ZP�US
t�#�=����� �O�@2� � Vh��IAI҂c�!�@5��� �ȏ(HP��)'�%"��F\СΙ�=Id|�(A\�+p��v�$�q��D�F�.��(
��)�� �	R�����K��@*�V��0\wA�$�i5�������v�o����|hpQm���x]y7����|�oi���~{�ۼcN�|��o�嶪\�v�W�s���(i�yfq���M���}�޽�kq�����^���:�X�\�k�X%c[ze�^x��՞�wwull���ۧ��vGʱ��l6հ0I��&.���ɍ�oU���'y쮳m��ky��Ɠz�l5 �S8���ӏ���f΋���{��o�������?w��>㙷���
� �%Lc��o)r�ɦ�LO��|]#��G��^��[h~V���Z���#���<zI���v��Vٯ��Gq��~�t9\��r�� �L#������������k��&��ې��i�=��M��!�H����b]��� ����$���� ��}�j���P��?owo�M���F�|��{H'	N=N��6��ngzݻ�����/F��UC� �C�X �MU(�B@�����h��ø.��:�j7��l�J>��:����-ۗ��X�]�e�{gs}g��m�X-�4��@
z��G̯�Ǥ۽�!���Ci�m�>Co��Kw�w��ǋ��؝������-4긒�"Sy�t���Wwm86��k/Y�׆�t (fF���4�3q�77�������[s��n�8���a��u���b(E�#����<��]fq:޽�����i���{N�绤})�I��i��w��oyZo2�����UG�P	t~��O���w�I�_�����������[հ��-��y���h4ڷ��v丝k�n5�g�~����ݗ���\�t1ۍ��M�s +�S��_�v�Kɷ��u��~�?��K㦾W�F+i޽��q�����nKe�m�V��kmn$Jɳ1�_���d믗��<��}Ž.?���k�\�9�.�hCz�i>��\Sk5�#�^~NK����iww6�/��Eɨ�h1�s�l��4�Y*����3��v�Z��� G(LEW���kr��w�Ps���f΍K��6�T��ٳkoe��+��4!�]�P��:���w�nƞ��}�qo9�����g�n��a�Kh�%˒�NO���Y��m%�_wM7�\Ώ@p����n�9�}�m�v�ǫJq$���H�vɵ-h��4���A�H��˖�����1���zu4�S�f`�.Y���ݹk�7.��&Ѥ�OQ�+$�y���Y�oi�� GnM��=;�Ś<�4�~W�z#�c��u&UO�&�zV:G;ݶ�hnvNyF���� ����P#�f3��(�@� W��@��"f	>��{ `�3�'P�p���"��r�
ZR������H@�(��� �^�����z@H��IHU.�P0S����C���J�JnC����(iU�.SE1E�!A��',�gcwL!4��I�Ɔ=�!�fP��SFǒ��0��o.�M�!�X�����^>_���?�^�c��,O�;�����{GO��z��(4���$bsQ���]��Q}%�V�Ŧ��� ! ��!Q���`o/}�lÈ3��Ǌ�G�׳���ؾ������j�������O�/�Z��{��"DBi�]z��{HF���AR��i>�"� ��A �0N..�PH�qp��>�����%�j��T\Z�R@2\uV �o�MR��QF3���h%L��z�j3�n��T ��\�6��方�H>�H8�E�yB��I@��J�o����v4�a��_y��k}Ky�����vOse���
�pR�ӏ�M���w��^-f�������?����;�Gp��-,�m�m[s�H(}H}%c��n9��>뗻9����?���ڽ��k���kh�.j�$�"c���� wM������_^��ߛ�mn��ٶ�}�^ڢ܌ߴ�v�Z}���:1/֞��[��v�w�Q��->���t��\*��o��[��Y��'�.���%�O���@��wo��[䶜���[p�rŻm�ۺ���\g�|o�8�5�����]>���׳�mî ~0�.�� t��#�;���8]`*�Z(hg_�/M�'�� ��t�
ɔ҄ʨ1'�>��4�@�`�͟�ݡ�� fn��!�d����1��{�6��^��MŶ��2�ĦB0̄�dy�����ӿ�~��� j����,��[d����{ש��H���gUde<+���$*�P,�)U\���O�ܸ'K��X�� �������{��^�x��xrVow\M����<ww;�2ݭ�	Tuہ�.��5��7��U�f1��c�\��S��n�9��1���M�~u�n�k�?ٲ�!Z�[״��Txú�i%�ݽ����8�[.a1�Q���=�c�>��a�q7\v���-�8ɗ��pO���保��zo�1����7oӶ������}�Y�����i�(�f:�$~jLmK����}x�m����ˎ�J���'o���r���ş�˼��j�>hp!ĐtIl�X���r�{���5�~ἅ�7lR�!l���Mc�t��'�{4�^�%�ժ�6�t��q6�\��ڸ���JyGM����6��b���3}#8�ׯFױ�>����շn�n����s�]��:��Cm��h@O���v;��޿e�n�W�G����Ϯ*���ս%��WR�8��V�I��� �M�s�8�6�E��j-�RF9�g�7U��VL4I�N+Q���oF�ؼ�m���tД�����?Sӭˢڶ��AE  ��$��k�;;�E��I�Vt��Y /�V1w�������o�1k���`Gn6@+[5cA:�� �<��'���������n�\ڛ��m�u��K���V��K;6�믧��KL�Ұ{����o�o����~�5����`���x�����$~�bwgZ�p���W�5�7"�n��d�)�`�2�H@k�ڐ@Ra�^�#,H����bg�#5�4	R���>�$�H�cr- ���M͓��)ƴ�pe���&��3JEsXI �b���TA�
$ ��N�䏉K�BW���j,b�@P�q!i"�_#K����ܓ���)�4�俯�ů����c�l�I͍��{��X�r�mŋ�wq���[*0Ӻd���/��>���� &�S�����Z�Z�6��YP��Quh1�X �@:�{LZa�׻F�x�%˲�/<a[N����V�k�e�t��J�q9>[�&�4{�Aʋ�ϥ#�=��3��P�	P�@�@)9�8��ʸAF�Q�ɒO
y@Ss�!����:���N�����	c/
B��{����o�
'\s��+��'�CE+3TJ.wo@��Bb
t�Cop�Q�
&�����7�[Y*/9����Z}-sʹUQE��g�J���&��p�����o�\=��m����1����F)���^_�̓���v�[vw���rfo���p=�����;J��k�i��OJ�f��qַ;�խ����m������ݲ� A���'{�.Go��,�?q�]��^~�M�5t8;��
u��l��k;�76�mx{7Mac��C���ޝD6�����M��#�?�^Y�� �}÷�a�7c�B�Ʒ�Kw;F(^�i����ǋ��� =��o��l\x|�CI, H:����ɗ�ę����2�ZN���BA���z]6�^����yu��M����,�(�)�����̢�g) �VX�*8/���wmv~�5M�[qmĔQwh�9ǣ��}�}�"9��MR'�B<�}6�/�� #����f��r�[-6�� ����ck��M��R���S#��] �6�,��+e �*�&U1V���                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             x��blob 3315 �PNG

   IHDR         �w=�   	pHYs     ��  
OiCCPPhotoshop ICC profile  xڝSgTS�=���BK���KoR RB���&*!	J�!��Q�EEȠ�����Q,�
��!���������{�kּ������>�����H3Q5��B�������.@�
$p �d!s�# �~<<+"�� x� �M��0���B�\���t�8K� @z�B� @F���&S � `�cb� P- `'�� ����{ [�!��  e�D h; ��V�E X0 fK�9 �- 0IWfH �� ���  0Q��) { `�##x �� F�W<�+��*  x��<�$9E�[-qWW.(�I+6aa�@.�y�2�4���  ������x����6��_-��"bb���ϫp@  �t~��,/��;�m��%�h^�u��f�@� ���W�p�~<<E���������J�B[a�W}�g�_�W�l�~<�����$�2]�G�����L�ϒ	�b��G�����"�Ib�X*�Qq�D���2�"�B�)�%��d��,�>�5 �j>{�-�]c�K'Xt���  �o��(�h���w��?�G�% �fI�q  ^D$.Tʳ?�  D��*�A��,�����`6�B$��BB
d�r`)��B(�Ͱ*`/�@4�Qh��p.�U�=p�a��(��	A�a!ڈb�X#����!�H�$ ɈQ"K�5H1R�T UH�=r9�\F��;� 2����G1���Q=��C��7�F��dt1�����r�=�6��Ыhڏ>C�0��3�l0.��B�8,	�c˱"����V����cϱw�E�	6wB aAHXLXN�H� $4�	7	�Q�'"��K�&���b21�XH,#��/{�C�7$�C2'��I��T��F�nR#�,��4H#���dk�9�, +ȅ����3��!�[
�b@q��S�(R�jJ��4�e�2AU��Rݨ�T5�ZB���R�Q��4u�9̓IK�����hh�i��t�ݕN��W���G���w��ǈg(�gw��L�Ӌ�T071���oUX*�*|��
�J�&�*/T����ުU�U�T��^S}�FU3S�	Ԗ�U��P�SSg�;���g�oT?�~Y��Y�L�OC�Q��_�� c�x,!k��u�5�&���|v*�����=���9C3J3W�R�f?�q��tN	�(���~���)�)�4L�1e\k����X�H�Q�G�6����E�Y��A�J'\'Gg����S�Sݧ
�M=:��.�k���Dw�n��^��Lo��y���}/�T�m���GX�$��<�5qo</���QC]�@C�a�a�ᄑ��<��F�F�i�\�$�m�mƣ&&!&KM�M�RM��)�;L;L���͢�֙5�=1�2��כ߷`ZxZ,����eI��Z�Yn�Z9Y�XUZ]�F���%ֻ�����N�N���gð�ɶ�����ۮ�m�}agbg�Ů��}�}��=���Z~s�r:V:ޚΜ�?}����/gX���3��)�i�S��Ggg�s�󈋉K��.�>.���Ƚ�Jt�q]�z��������ۯ�6�i�ܟ�4�)�Y3s���C�Q��?��0k߬~OCO�g��#/c/�W�װ��w��a�>�>r��>�<7�2�Y_�7��ȷ�O�o�_��C#�d�z�� ��%g��A�[��z|!��?:�e����A���AA�������!h�쐭!��Α�i�P~���a�a��~'���W�?�p�X�1�5w��Cs�D�D�Dޛg1O9�-J5*>�.j<�7�4�?�.fY��X�XIlK9.*�6nl��������{�/�]py�����.,:�@L�N8��A*��%�w%�
y��g"/�6ш�C\*N�H*Mz�쑼5y$�3�,幄'���LLݛ:��v m2=:�1����qB�!M��g�g�fvˬe����n��/��k���Y-
�B��TZ(�*�geWf�͉�9���+��̳�ې7�����ᒶ��KW-X潬j9�<qy�
�+�V�<���*m�O��W��~�&zMk�^�ʂ��k�U
�}����]OX/Yߵa���>������(�x��oʿ�ܔ���Ĺd�f�f���-�[����n�ڴ�V����E�/��(ۻ��C���<��e����;?T�T�T�T6��ݵa��n��{��4���[���>ɾ�UUM�f�e�I���?�������m]�Nmq����#�׹���=TR��+�G�����w-6U����#pDy���	��:�v�{���vg/jB��F�S��[b[�O�>����z�G��4<YyJ�T�i��ӓg�ό���}~.��`ۢ�{�c��jo�t��E���;�;�\�t���W�W��:_m�t�<���Oǻ�����\k��z��{f���7����y���՞9=ݽ�zo������~r'��˻�w'O�_�@�A�C݇�?[�����j�w����G��������C���ˆ��8>99�?r����C�d�&����ˮ/~�����јѡ�򗓿m|������������x31^�V���w�w��O�| (�h���SЧ��������c3-�    cHRM  z%  ��  ��  ��  u0  �`  :�  o�_�F  IDATx��_h�a�?��?���b����E(\hٍEZ��rG�[7�W�+e��p1��YJ��5�٬3�쳋�N{����Y�����������}Q_�*�)�Wͩ�j�z8d�7�a�P�U�%@��Y4���� ��V������H�q`*6'�_�6#+��� �@g�� ��Bݥ����l~�@0?J�M ��	�@M�#�Q��x�K����F�,0����
���;O'Q�u}�� p&����F����pp�J+b|KX������];�-l����eԫA��A�S[Ի�w�1E�~�;�\n�TG�������/�`(��� [%�	|NGܮ����Jd��,��ɾ>�\�
Ϋ�֪/�uY���1[���\��R��M�`o�٭�m�8-�Ƀ�.`����� �9*���6�n`����	�?׽���꧸k*괺���o4����J	�y7� �g̅J>8I��V��ߍ5A���1<Ȗ�i���/S���O�ԯ��B�{�� �")��K�    IEND�B`�(3.�                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ���� Exif  II*            �� Ducky     F  ��http://ns.adobe.com/xap/1.0/ <?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:DocumentID="xmp.did:0FEC025434E811E5B480C51F3DF34CB6" xmpMM:InstanceID="xmp.iid:0FEC025334E811E5B480C51F3DF34CB6" xmp:CreatorTool="Adobe Photoshop CC 2015 Windows"> <xmpMM:DerivedFrom stRef:instanceID="61EFBD244302B1F279CBE81F087398BC" stRef:documentID="61EFBD244302B1F279CBE81F087398BC"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>�� HPhotoshop 3.0 8BIM     Z %G    8BIM%     ���ȷ�x/4b4Xw��� Adobe d�   �� � 
				




�� XX �� �            	           !1AQaq���"���2�BR#�br3C���S$�c�4%EU     !1AQaq�����"2���BRbr�#3��   ? �j�<W��Z�=�<�F��z*�֨8y���P��Ab�>,���]VU0[Ϛ�@���\		T%E���E_�A�ޢ�8(�� OJ N� ���ڀR�� F��� �%@�}�/j E�WE8$�@{oA�0>�EAj֚�Ir&�k�SDF]����HD�QD8������'�D,��(-��F���N��:tC:��I����Q���U�1����o�zq��q*���F�QQ(�ڀ����=2�� t	@�$��$	��\W�]���=ȋ��2*�U���,@���,k��A7� ED��j	Z%J��x4-Ѽj�4�=�)2@�r�r5A	 ��@O� �8�T
T�� 	:�� ���@���0�
Vt@I"��:��Dg]?�s��P.�����	
~H%i�T�(.@���P2%:tBj�I�Q�E%R��B����QfށE9�@�ǚ[��
��EL �@�2��/�@���$	���� ��f�i�z��[���E�1QG��(�y���D�*�W�ˏD�+Z7X����@�/4	h1b�eT@dO
�<�B'^H���Ta�!�@)k^(!˂"@"�l3r���p䠱eI�k���Df��z���,<����@�o�k��s�ՓQ�rF����%:tC:�L�t	�$Tfh�T��n(ʣ����,[c�8�	*��AAQ��j�A �� Z�t	@�:�:��:A�0�.�+V�]*��j`>aR.[��eV`x(�܀��G@P_r	�%���9�ϑA�gEf&�(�@�*{P5'@ơ� ��ڀ2� ���DT��P2(�ך�ߪ	^aa������EY����R��
�M>�ɟ�DJ{D� �,�Q.�@��Z�t���A��D�ΨN�ª�D"x���@�Ί���UE+ćb��?UY�m?�(�� �5DF�
)ΈS:	�T��:�:@�t	�:�@�@�����j�U�W��n��}PX�{��EZ��j��.��DĞ�D ��"��z��+F��E[��gQO��xz�rP7�h��H P
O��9xW��� +ϊHsDU(�H7T�P�4yꊵ*P)�aK��<����rA1W�QS����܂Q>>�	�4m8nh-Ç�A梜�g�(�T7�~j�Ҩ� p��ʢ��"+��{QV-�}�
	� ��@�����D�`��.�t	�$�!�I@�	��
t��24+nb���!�J����S"ͼ��h�E�Y���L�P����s�@xd���`x���t>��bnJ"�D�QR<��Z�^h��� b� �'�� �O��i�S>��J��r� ^�5�@h���D����4P4���TSȖ��S�q���/`@�~&>�#�-k�Ġ�o�E�"��x"��td[��T1-T��PBzW�E;�k^hw��x2���A(��(�P&�-�T3� �)ߒ@ʡ��C��"��J@�	�����P�Nf��Bj�C~�R�Z!��|�Ɂa�An���opmd�L-��M>'��W\��%\���{�׫��2aj9���~O[UՕ�E�3F��ƍ��(����$	��!�� x�E�@9Q��dP����ǂ)z�"$�ǗQ?$Af,�L�<Uo�7QD� ���k�	�A�@AO���:q�PY�ˊP%��(��g�b%Q���EBP [�2�QN��x [ڀ�󮄠 %�A!�P:)Z�4P7�z�N����'@� H)�	�RU��E|�;�����V��R�@g}�/��2�>A�Y2ȧh�G2�����?կ���y�5|Ыv�	j�Sv�"��&GO�f�5Z���v�sp+�豭d�U�h`YD;���g@�^�PE%��R&�P��r�~"j�E����N#�� 5����E*���-g�Ɂ��eAښ� �EL��	���PN%�'�- �MT����@��8�@��?��z��^h܁� �&��QR�u���D������@x�QRQQ����UN��S&D:� N����	�IT'��N�p�pTT��nM�G���Zsԕ�W��"�i�Ժ�	��y���A8ߕ+�%Th�j�<2���:&mf0 y4j�u�u������#��ԍ��@ti`d8!��"�L��	��ۚ R'OT%���9DI�� �$� �oWz�E���TX�
�Y�rg�5DQ���� ����N�(���� D���X��*Bp,4R�w�e?� j~HΚ���o�<���B�fKsTT��Q%��F��P-(��:?j <}�,H�"�O�8QR�TRD7ح%/��U	�P:��H�pP$¤
ʤ
+勒wa_Y��'��5�K���Vs�
5 7]Z�!	���~J���o(�L]͖�A?z44oU�2˫�<����B���#�vټAր�wb7��qlxp*�!A!O?z����2H���� �"~�T�����ג)ގ���J�/F�E�]�;pB�re��:���O�UTć�A0xp�:	�P$R���<}� ����e�P1@ȅƜQL_ӑDF��>
�OEEK�5d�I� <=�>^�?�D����@x
*�*'�܌��EI�I���C:�_z�q�@�@�|�-
�?4��@�j$
��[�z��\(*\� ������$�[�YiZR��PG�֌����>�T�t�hU��.�� 1F���O**ˢ�|��	�槫��g�%��Dr��ƃ���?���q�!� Z~h�i��DOǒ�3<�'��"��H"tׂ�Μ�3�Ƞp@ {�S��^h,[<9rJ��T�^�A��*��*��J�`�L~'G���K�$����r��$�0��QO�8�]U�z�LHD'�8������v@+����[��"�Ő�?$쀑��*=P$"(�%�T����� O��T����	� ��	� ��8QRE|�2���UUfCr+"��c�uJ��Ǌʪ�@Ո(uP���)�����Hs6��ب�n3?����n�g.IR�{v�N|�*9�v{��>�p�^��N4�H�] ࢜T�>*!�Ψ�y \�����-?Ey��JM�`�&Mơ	}'��t�(=�$��=�1
USoࠧz�b�A�~u�Uਘ>(	ȉ�� mQD��M8���ՐX�d���J&.(%�_My��\��/���澞�B���)�g�!����.�P�&y+Y�v਀@x���+�@�5���xr@h��8**'ވAE�?z)?�$��&������	��@�$��(�A PH�|���J�$M�*��}�*�vT<eU�*y��1 ��䊳c���cZ�Kp���nL�:�E�+��z=�H<�O$g��Ӓ͆V6���>|d�)bm��[P�վ��8�_����V��y�h��܆���D/Rru���d�
�5}<��+L�y��=U���	:�@��P8<~��@A.*U)·���վ�}���	*&(Y�$�'�|�.�,@����"�P�iQP��:��Â󛏯4_�!|� �$/�]QPL^�j�J���� �'�T4O:s(�j~TA(��,Хz(�H��5�P�h��N���T7ܙ��T3�H��䁞����	�h�AA�L��U+jӐ�K"��=4z�S-E;��^ )Z+X7Ό"yF�n�d�W�֦���]vo��|�u��[�6XD?B�-�h������i�@[La|LE���3]��j6� á�,8*�^��(���s P.>\�"Y���W���"*����i|U�h��EHK���$Z �O-QR�2���PQ�s�H*JO���(�0�A�x~($�$ƨ	hSTe��N�k��ݣ�Z7Χ戏�t�\P��Ƅ ��<U��j�E7�V��F�$D���hN���@P���{PH5��(�ꠘ�E�;�����Ǌ������!R��f���7��B�C��&A!���Q_#\��@(�.��� �+%�f��z�u���>M\^���m���2���#�}�SS-�M�1o���-a8�tC<i�"�-���
1E)]FX`�)� �� �WD]�fQV�WDcs@袋��T��5A!ps� qs��@����A1�>��\�� �
�%��3����: �>�$	ח� Tg�<Ԫ�v゠�vu*EI֑8���q��C	�Q�X��t(,	P{�Fe������ R�@LΎ��n�آ��^���!��N\K�1����:�%�1�Vm^%VW-�֐x�sE5�䀠��:�������@Q�� I�PE� ���QK�"Ψ��d�cBPK���t	�D	�5P�#B�W���Cܨ��Q�+���������i a�ja�:LD����V�6R���L4�`D
�~�,b4��ͻQMAD4�B��_-��!���D��(	�i�.h'�~H��=����B��?$�Ǔ*^ k䢢o��^��Ӽ_2��;�����	��	���N_yA10~�DĀ�C���T��ۜ+�aT�\��)��V�$$L&%Ģ�17�D�����"q��ۗ���S�rAK^<T���ג����*4��O�PD�W���� ��^\�1�ʪ���h|���6�������[%���i�x�9����	A� gaOb	D��b_ς��DBR�E��@�bͩ����� _��	G u�b�1A1|>J��Ú%���c�@�T@��$D��cg �KqW
��� "��\[1�������#�L�6�p�<fj�hϘ��0��$�x��p@�ob2f�� gD3>��fb�y�� ��qA� �c|���xpPy>(�N��htA^W�: o�MPJ7�J�$oi���T��N��h���.��"��h�R��<U)��UR�o$D��&��$e���!&DX�A��J)^�y,U������֪7=ꈛ�ֿ���|u�@3t��Au��h]���LIh������ܴ��:p��bX (:U;�D��FF�ހ�B�hr\�U��4ג�
W鯂�̖Щ�^Y�z)�Dfgf� x�s>J���� ���2`H��Te�tL&2��*���#�����ժF\�M���Ty�p�P ZQch�ADN��	�%#�P!�ڊG@A!�W�j�Dh� 3�Q2qs�EK��j����Ud�.Tj�UA�N( `H�&Լ�ٛq�@9Y�"+\�?�*��x�PBG��A�@������_0�x �͓0� cp����>j4�9f����|8�q{��q@X�%�{���@h]<Qc7�Z���*�fÚ Wn5}���xpX��n�V�EG��|�DM��^(+�8��ox�?��h]y��JV��O]#�sA��Qn%��9�(>�Otd��� � ^�gA�~�q��Q��@>
US��_Ǌʪ�)�
���<J&CS��C(V�&2��H��8��$3||�9��2`H�x�UɁ���2�\��%G�2a�f�Pg֑n�J�<�r�%���"u	1: F�=tE/�A��8��A*�����B�����]m����uDJ&G�B/N*��?���HZ��
�����c��b�j c�� ��$��L)��߇�
�t�pPT��D�\���?$�+�o�Exh��<EP!h�4� \�xz����r���G�aSκ�
 �ܜ?� ,"i㪩��D���Q�Ƽѕ�~@�[5䲪9�\��Q�;���)�:e�fF���+���QC�ǧ�"+��������~�
�6�Pqn#�Ǖ��.FN�	����X D�q@��� <>�zAZ���l��⯅T�̻wP�a��r�.<TUi\/�B*m������X�_������u!�5�@�0�����jLg]��a��Aw2�N�F�&[��-Fkb�����j#�a#C궉Ď�|�J����E8n*@<!��cl���`C�wSt�����L2-�:��nxqU#��QF@X�~jF#C�@(%���6F�����*]��3��5v��Dg\�6�A�ʧ0QK�W���r��S��t@���q@)X}U8��Q�~�z�
1���7�"c�2 ���~�@h�4p�ѵ����}T¡<@_���<xU0�\��zS��nm��8)�)�ۼ?��o`Lh���)�ލ[�fU�n�~�\�jmp?�A�m�?�t��y��E\�ǳD�= �o�U#/��FE���r�P��AK&My� '��c]����X��I�'�*�+�����ފ_3���Ҹ�i�*���  ��5��b�$n�"� �*# �����r}xꅎ�"E�K*�p�1/�Q�:�]�Ò�F���D�<.x�2/�����Ԡ'ThI�NHa AӚ��s��UωLg�Q!>��<08"
Q�B(�� ��wP4��@Q�ǎ��	�9�~��e���V�dT��̜p��M�|�t*)�r���� p�"b��T�]^����ڊC��?41�&0C芘��_��La tQ���*����!� j�E1���XCR<� � r��m�D��U�����E;�I?��L*��_�L
�d$�+>&V��N�Q�jBV��8�?5�`JN���25�f3q�������U<$�QAfܽ��E�
S-��U�u�h�Z�+ׇQeͥK��Rk�5#t��*?0�1�(w�P�k��@��H&�%v�,9*"n� �ͯ�*�T>ip)jU�9�@�����A�V2�0�i_U�j�Kz�֔� pA!C�y �����c@���5Qb���¦8}�@y����1Ú*@}�D"������(ыe@X��DS^�(��:�h$�� i�_�
6��S�Ts���:�����+���Y_Ǆ�і��n��0�0�8認QPY�$l�Ҫ	�#Ϛ|��%��E�B�%�Ǣ�<�?�C-�:/����~"m��G���% e�	Ҋ�O��+O/�|�DW���d�D�po.H툮�Q0અ)0ּDN������l�	9Q����q��,�9�������b�7�T�6��6-�S`�M9���N( n�.��"��V�{��J�Ur���b�+�>�����Ӓepxݑ.hQ�Rr*���� s�n�ܨz-%�-6�*�,PBP<5@>��Ӓ� ^�
�dx8U"(����`k�h�� �MP���ƨ%���P%��  a�B��h�*(�b#�؂��؉x�d�f9�&W�݌���,G�.��B"$0A^�([�Q���)�NȌ�ش�8�&r�9U�v��xG�<P˚��xy�$)P�c�"CO���C	j��	!�n|:)7C7$0L�bp��DDƈ#��A[��J�5j
 ��=��ۊ&D?�%E{���؃>���{T@���-� �IqA��h�S^(0s6�p��X�����^����b��u��ץ� �Vvr-��f�|-e\̊TKǒ���Oj!u����0�?� �>^h�wQ@7Hи䉄E���.�#�8��T��"Cr��5��M����mY�h�-%]7��BFTngEY0>�����&"a@�'�?�%Lr�8��v�H��T�dT��9j����� �oE�*�CW��u��]b5(�F�G ��,5�
�ܼ\j���^��r��a~��v�#UqU�pb(S�EK�����TU��� gT8����HE�8��� ��|�Hh"o@Qѩ7�?��r�/D�L�K�ß�Ʉ�v<����b����&�UȗXU�����b�� p@�{1`�&!��@�h��* ��o5��h��+}�$X�}���؈���E���8d0�=��PµͪH�K�$%N�=��B� nZ�#�W�g����ն\�.~i�L�m�ٽ�r4�u�U���>u���s��ג��V�;R�L���\ ��:Q ���	��%]X��Av�O�?�V[x�V#ol�ֵ������ky]d u+r9�l�DQk
(�� �R�cǊ	 xDGA8�8��h���b��+.�Gy�;WY±�"dj��fֵ�F"���G1ۊ	t�t�.J ��Z��<�Đt�W?7I�v.O.�m��.{�:|`"9�B�č/�@(�- h���y!�B�$�)�U�V%W���eZCت�}ڪ�Q����^J	Pp�T�otD��1rwhZ�70����*�{�\�ݼ�/W)�x����G��ݜꯓ>0�#��y'���bx���L���������j�OS7��t�uf3��'�����	8ՑN	>H
�����oj��z҂��z�Tf޶�DNx��6����P� ��Dԏ��A��2ŉ�pC!PA��U2��k⠯sm��"��Ե�!\���ס��#+��M���g��\�ʲ_�$���fՕ{���'��Ӊ�ύnn ���Մ��y�X�ȷI��i)��Ǜ �%��f�h\+�Kj�c)qg^��=�Ѵ�U1P��E�|PHΊ(�r�QD��
�Wzbyj�\7�c�r�z��\gZ�[x�������YN#R�� 4C���˹���Y��X��B��]��.�wl���kH�t�3 "*Ԩ]�[������#��O4��Ш�0��@�*����1T:�T&4}��	Z�$jQ��I�&R�u��]���	ԯ'w��3�e��q\ދ��4��[c�,G6��Zx�͐hn7CV�Q�����Zf��}�s&�񢩆���J`�ς���GI�"@^��֤+pZe>�!>� T�A0��o4C~@�؈M��E: ށg����� ��Z�b�:8��G���������*B4��S�}\�t��G���K�Db.V��T
X�.�e�$I��J*��5(+\�!*t�D0�sg�$��扅y��11Z��o�4Y�@;?��	�)춀j/EcW@�ͤ��.L�c��A0*�qEK�E�p��0`�L�/5��m2��jݲ�U�u�;U�� i�.�r4��!�k�͈?Ęf����Z'�'�w�����K��g�i�ɸ%q�V,�<��[D�M4L5�Ԇ-��1F���nj�Z�f��E\�p��Bd�u`]F�QLPW��ZaVtҜ�|i�P���@�ߢ	�����R��]q4�����1�s�����Y���]Y��%>�j'�<x=��I�S�ߖ�E~#�;�����5����������d��E<*��LLK�#�?����nL�<8� .�9e�fE�4Q�P�N�:!y���Q�H�0M�E=Q��*�ހ�*� :4Q��`� ��l?ĞFB��l2�O(oV��1�*y�Q#��?�<��(��mK��>j�Ab�d����r�!T9 |=���a�D�7�@�> m��*e	Y��D�4I~?mP
X�Ѩ������b�R5E,	�=H��i^�K�d\!,�t��Y��3|
��)��̈́E5L
�7ps)-H]��͉�����[�r�2/w}���x�3�Oj�b�&(ݳ�7	� �c5���J���%�oc�q�|/����m� U�ݼ;q�䢬G��ܓ"b�G�$�Pf`P/�$-1 ('���4E@�L�K��#��T3��>(�b�Ě�4@�\�
܀���Q^X����4`�@<�P<*)DR1</�A�O�Ko��>h��@��@H`D0m>�0�a�(,��=��TT��<PBW�<y"�~<�N.��t����E�%L�4ȋ�DU;��A�Q����^k9FU��Ջ~*eY��n��j��{&��	"�ȡv�D�u���\*L�7� ����.���]��S
����|Ӛ�1<bݞ��l����:�/�umaw�G&&��Y�ќX�����n����yF�����S1��D3p}PE��8�`�ƈ���=JD�^�7O��A��æ�B�-�>+ w���*���4�O ���pyj]��ˠ� VA�����1�X�F��WtX��Ϩ���y���2wM�r�F4e=$^�嗟}�����ː��)j�[ŮX��m=�n��0�6W�^&�n�A` L�MZ�b�z#X?����e0��t�Cژ3 ���*n�5pϔ�ho�0�$(�!4���$��bz\��0�qn��u	��v�Rj����z���LE�
,L(�}�qi��6�T�Ϊ�5:�!���*�$'��C)	� ��� ��(LH��TP pA@�@�@�������@��-�v�YX� �D�럛����U�0�����U�jm�+R��.�����X��"*YEg�dkU2����'�g*�ȺI�S*̽7�g*Ͻ&w׀L��ː�/T��^w��x�@��gB�Z��jiÚ�J�@�B�\+�!\��Z<�J����\Ǹc!�I��;N��Y�c(��欶9ޏB�1zؐ�U�?O�F�"G>#�ģ8&j��C�S��&��F�}��� .��F��%�^�	���V�fdI���W�b����i��pl�!�h��wݢy��te�}-�e���qq9�ύU�^�ֺ���,Xg�y0��߳����nMa�� �@2�Kc��>��8��Ȉ�8�����ni�����;60�w�^����p��#��?���1��nK������{E��n�s'��}gl[�M:��+�K޺O��{�]�������j��O�o]��[z�����yo7��y�Z� ��N�_w�N7����?ƞ��������iZ��/	���� ����}-nm� S����&��@k�IS�䝶b�����6o��m�6������C�y���׼���>��_��;s�fý��͉���b�Z��}�:^������7�CP�=:�+b��\���u�e��L�;��.#�����eV5#TD���T��Hs.łӘ�W
V��zz����c!0�>�8�E�#���*`�� ��]��Q��ځ0A/@��?+LTwv�"~�)�*��[@��լM�ڕ(�Ȗ��Z� %h]��+�nHE�U�~z��VFm��W�Q�1�7A��"�f���Mϼv�^�nƚ�q��;kǗ�}O�l��è�m<+�]f�9�ϫ��7�oE<�\jɻ��8o�3��(G��)-��t�\�c���Ju�W�dƭ\o�xK��?4�lcw�ߓ���J���5mn�/ a0_@
�݋ǅ�yZ�|�Y\�h�_��,Ayr���v)�x6gq���g8�냚��5�T���nT	�0z!��"a� C
;-�������%�P 4'J	tu(��k �Ʀ�X{?9��Z���n����B_݈��l�ܶ��}����\1ffF�W�;N�_&�ly���7��YJ8�ځp$K?�6���o�w1��p��v\����Y�=z�Z�=u��a�Xs&2�"��WY����M5�)��f/�C
�{�#W�X��6�w��O�Ϝs��{�N�l�����S����e9�O��#©�Y��4~��M8:�u/.˶>���t�
��ޯϳc�6�y��s��>GY�ؽͳg �הuזU�vq��F�b���h��rm��Χ'��K�j�S��v�]蜽�?p+(ǜ��|[i��3��7�[i׎��н���;�-��+ѹj`�oNI��.z^��.7��z�掅T�B�\y-(��.���'i�?|ݱ���cj͘��H��b�s5����Mm��~�� �]ɺ�;wa�8M�J��f:�^b�Q�r^�߭�=x��[۬����q��1�ce�%r���� �ʶ+�Rq�������ͬ��_��V�-wWoܳ/����̏�D��yrOj_�4�������+���z-���q�n ?m�����z�{�� #Y�����s_����ǩ`w۸[q����1��2�����ݫѧ6�� m��k'��fZ��,jy($D�<�wt��DƼ'@� o��0<*�ň��a! S������3�?wn�����b�0w=��/W̐�s�;Z�����k�)��(+���;I�_Xr����/ӭ|6�fG�n���JOvC�Z�Z�1|��N�ߓ��*��(�vg��Q%�z����A��媾2�V@�r���"q�̗7S㇐��wDrD*Vo_&�'xn��\�q�+��jn�6O�9V']������W��Y��~�����#�@v �I<<�e��M���}�������R��>;v�s�H:�Kw�����l�j�vF>8�h h�/f10�h��0ueS)���\�2�ߊ�2,2���Qr$o��ڂ}q4�uAǁ�޶�`?�%*'�Ԡ#Q.dٲr�+�b�Ӈ�L8�W�f�#��~���	FC�05X��������L̙N��F���ݺ78�7�.~��n$���F&�.亳�z�zu����Yrp��wf%>r.WY���ƺ����o�1�q�2��b�a�g}G�2��:ϕs��W;��;�Q-p�rg�m�Y7w,��{��I�:��ψ2rs)�X ]�T;��>��x��z�bH�e,��s������5Y��&�����.NF#��:��;=#b��=�1�~`L�Ξ^�������>�����̎n�t�d�PhA�7����{���9fgw՝��X����K�囱�\��|��/�������ݫ�2oB���ЍU1�`*��~`fuj+"�2� ,~�\��=�2��ռ^�kgKn8��k�=#����� F���A�t��>�P������
*+/�\�7uwOmݍ�y�ۮCO�ߜc� ��=˖�Z^����qosu��?��{o������[����q��sm�]#�̶�g��v���� ���ٽ��W��������v��e�ۮN�,�U�6�d��,�&߹3�4����/j�o��vCo�\H��Ll�~���M�O�_����f}�'�˧��cw��l]�r7mJ���	����]v�v�z���n�Q���%k�Gt��`TL�75HW
 �-��L	�6��O4�$r������L]��EK��HH"�;�&x�mX������u�wN)�>[�1�����W,��LH��>N�+riۘ��]5ۻ�%x�y}���<��>�$j,^��CBq]{us�$�^?�}*�����lW�cK�����V��|�w�8<��3Fx��Hj.[�}*�_V�&������� �xo!K�8�W 3�?��D����t1�
x�]6bK�. |GK�=����}�a�왙�F��fQ���Lˤ�q��q�_ӫӻ_�X���V��71�<Id	��CQ�D2�v�o�����͵��^��~�������n��*3�}'��c�޳~�ۮ�?���7��s�v�t�Ć<E�j��u�%�� �P#He�� �b��)T�`#fA��)�G�Q-�0$%.⋔�zn��X1�J���U27L\`L�9�x�kt�\lp@�(�S21w��}��NŁ!��< .W;˞�K��#�w�����)rD4�`�K;^��_�o�W%��J�73/�qbi�[�M^���vbgwv݇�H��m�=��߷�`Z�V3k�����o{�Y=wHP�{��	Js$ȒO5p�ª��.PJ1�7(��-PK�˝�.>?ι�(9��0;��27���Z��w��*��+d��=]���?w��@���0���-�Ϸ$������{j�0���� ��q�^���\�M�#���������Y�G��ۭ����\��_���Q���l�Lgk{̌ƤH�)� �}s�_�����3m�m��rʿ�T��Z�Iޮ�;k� s��K�ŎБ��~�$z�'#&��Yo�Y���k垯FǸ,ŉ�����=���N�J|���j�����,_����>��X��P�&MV���^-���V���c�j��w|ȁ�%��"r��,�ɞ��x����5�s��r�sw|���q�ogf\�싒52�൮�Y����4�k=�H�V��A��-Y� ǂ�q>G�8���l�U�� �~(�F�t\�6��׸.������%��~}�&>��n6�]���7^����X�� ����#kt���Y2ɵ�� =�{����۵��\� ��_���޿�zN��gm�Da����yq��18�
�{U��w��N� i� ';v�92�9۹�H{U�V���~n��'n��x�>�������{4,�W���(�Ĳ�yl�֕��;��΀~¿,<ף�{a�HxI_�S�|>�s����V�T'ɯf~Y��`��qȹ[t�e����V��8��&��K��Y�G&a�I<�0��<�jbP���th�s�"'�Щ�_��^� ����L�wk��"D�ۓ� ~)�ox�t���\�������ݍ1/� n�S�G/������vE�� �X���x��O�����q��� � ���>)~j��z�����G�Wc�v�d>���)�=��?�ݯ�=�l���M�P�j���Կ[[����m�O;Gl�&׋e�����,�q�C�~)���v�x��1���-ͤ�f���/Y�ƌ�!$�*]�Y��1�Cx,�k[�LhʊY�3�	�Zg�U�h���잉��Vr�c1���J�	��׍QN`� �C���<MBqhk_��8��- �鄶G�wݜhJS�!%�K��y������[3��3z��E�v����g������F]W�E��j������;�����yݻ�:�ܭ]���rvs[�|T�tr�v����k/~�r�Ꙉ<YgK�L��I<���%����_�	�G�A!g�z����0�E�Bׂ?��C$�D3Aԟ ���_o�4�>�?a�ܷb_������Y���� l����� ���f��gζ'�'ϊ�5��ۯѽ���>����-�6�K6m@0�h��t�a�[��D� j0��
�5�1�:Z3܌�#��T��'d�F@��<(�)dX�~q`%�BݬMa��#�IR���
�Vf�12%��zx��:��a۬7�r���p�Y�Écwz��}��I�Μ6׈w�׫]���O��\B �N���w��z���������v�=�^ݷ��Q?*$��<�����?/����w=���Ց��z�=ʪЮ�D15(nl
��P*�T�� n��P�2���9:k�0+3�f<Hdq7}����v�N�L��Y�H�6� �}ς#��|�j���z�������l�[�fP�P���s�{��s?��;��=���}�#��̀nH�y�7������s����������v�������+�^�(�'�qY׋ǳq�fb��x��D���S�D4��^Eq����)R\V�o ��*2�!�zX��F����P!���4'p �>*b۹x���S8���/�C��
ȗ�IL��|}� 04�۟7�	����87���є�VՍ�+��G5sgvsgv�6]��bQ.
�j��n��4ec62~H�2�f�C��V��	h���2�>����%;[\	s��fԜW/8ݻ�q�$g��D]�D�+�wu�����E�=_+�=B���|��<ܒDda����c�ݻt�rd��Y=ZE��ř�Q2`H��#J�WGgX��)��n�����&W��?���Q�d� Ao$�,6<��cl�t}�dmm� M��t�.�t�ZNQ�?$jkv�+����z�nF{�� ��c
�ʺ.{r�=\S�n� ���}/�u�Q������n��Ɯ�y�y���{������w������e�ڈ��r��ɵ��)l��{##�"�~&�ϋ�u�=Sj�J��np�V���~%�}�o�|Ɩ�+s���\	��F�\q�ܺ]�׃�V�{ŌM�z����:��􀡹NO�>\�-���wenq�����k���F���7�2�y.�|�yx0�o2�4!z�WϹ��wfו��t⎹�Xh�����o��]^��o�~E�Y8���#�$_ȅ��ھ�ߎ����Y�obd��zD-L�<�:�o�Ť�1�u��9лfR�h^��O��_k�]f����-��ߘ^��8G�O��Av  ͧD��&>�#Zp}P?ؠHҕ����=�:[V�%CD��DX�>I�
x�A�*`ڜHp�yq*������e��ݫ��aw6�\2�#� ��O�b�+Ϳ������{Gl� �Tv�n�� �����n��K�p2�>qLo;_������y3=�����ݳ�l�<��-w.~�zZܝ���>�5�)���'6�ݦnu�{_i�V�s�Q�{�6r� �э�� �}2�-NMo���u�\V�>7�n����qȴ��Э��31�eb�r�����S�� E���#�A!�A15:"ln<����,i�x���Q6ɂ��Q��� 0Dk]Ņ�}2�V.=�n���=�X�+:��t��"�fZn�9�.[NL�l��g����PY��hف�y�`��T�w]� �xx�9 "W?;W?�����̛O�S���E�~����'��w,?��8���o�J����D�r�Z.���v�LO���G��ʌh�?��֮k���W�K�0�et�PImZ��	�z�Ÿ�U�}���%��XɨB����u�_�{��~�T� ��3��8��lc�� ͓�F���L��匭F!O�X��ѱ����//�v��V���[%rGX�@��w�S_Z��;��s�%�h�!� [Įr������X�{�gۡ�p��t����=z�'���������F4\nov���߮�M�p�x�MX��"��'�NBܘL�&�5�"56;�����،MΙ5 :.>/v�JR�;����/_5���Y��E��Y
[Æ\��;���g�׋7l,��˂"F�Hx�?���g ��+��G��s�u���v�ܳ|�h<x%���q��{Gn��5�q{��_����>w7��vw�\�P�<	^����xl.��lFW��G>�W{���q�mhQ�{dDuFϑS���k�~K����;?�>�n��ı�ٿ��n��(WP8�>ܚ��S���K����� Ɂ����q�n+�h�T��P7���P�ߡ@������ } ��;�
�>� C�R��( m[ �uTX��$���=�.L�:�@B=B�GMȗ��zf1 �N鴛L^��lV>����v>���±�<�_���w�I���<� �q��?���6���FM�����l�r��x��h�������?��O�?��۟E��3d�-fa�� �Wܝ󳼿������'�?��� >�� M�ތo?.���O�����O�����.G�F@�e��q&�� �@X� �4yUP@N�^
8?��S'c)�*6p1�h�ʺl<N��ӂ��o�R�)�-o*ɏ��
m���x�2��uh͊��9�n�!`�\� J-�ŀ:�fpt(}����{����n4b��U���1�jQ9v��B(�I�l��V#�4<J���,��ݐL�/���uY�1ՙs}�.�oK��wY0��w5�l��N����\���ƾ��wݟ'g�ɄD��ĸf�_�o�+�?^��/��k��@y�h��U�w�Kt�����O{�1a)yO���션u�/+��Yy���?�n;iU�6�|sW���nD�\-昭M��3����^g��WI�7zĿ�\��5�^�.�g��"N�gJ+�=��\�� Ep�j��9=,�e�,��uY��p���BL5!�lu��]�yۺ#)H�`<�I�7�sٝ�`]�>p1 Qo���T��t	������wI$K����R��"2iruf�v�����dH�]Vv�.��X�6����.R��x^�9�.Ս��P�ͫ������Z��q�ccq��:��7����.-�-��ۛ���˺��//&�~�_������fǇi�흾����.�HW���m�����>��w]�o��~ͽ	���ǭJ�<}�P����@��� �)��ɑt�P'�Ǌ�8��(4���a��iDC��	B.\�f�%v��FݫV���rg�1�EI�, R�+�ڿ���f����|Nع~"ck�h����]"P�	s�ɗ���G�\N���� �y&d��f}N� {����{�vl�]�ٸ�3��¶mfa�k<�bd���\�"�@^�}ygJ���|�_oY�����ǦU�������r�7��K�
`p6��-T֌�@L]�����.��L�J,A�D�^�_�D��rﯡ�N�ܗ�N� ���c��\� ��b r��B2��Y�����������g���2֞
=����TJ<&?�	r���$� ���y{���.*,lGa�[�(D���j�LB���v�e#�V%�2��M�1��e�g9�R���b��p[lI�1m8�@::�=[�g�5��;�$�z(� ���/�%�pL�_�R�'�����WV{vHg�S��&��)�
��/�2=BZ!L�S����b�B��2�D�BV�����'�����B)���N����r.���/����t�>��n�ku���ن`&n��u�_{��0I������߶�#���R������BU��jkk7i#����2/#�W�k��mա��e��S�[�3`/ސ=FN�h+�	b����bpy�:�%�J0�%P�f�{h6��l�'_�ut�2cx_�� 9#���l���l�V�n���������ί/�6n�fg�i]}k���=ۣ�@Mו(v4��7�޼X�_���j�lƳ�ۂ�Ѭ�v��R2��)�Y=����"6$��n�_�e��h�v�S�~��R�y�k����i3\t���g(ǁ�W����� �B�tnS�E���:�R}}}Y�{��cޕܛ���̗$��^�Nϝ��\�`:E}�ni9@��SԠcQ��y�@���8U�J��r!ǽ�!D_���(���x �������z?R�k1��b-v�/E�r��eF'�`6��D����oo?��� ��>��W���Ν|?�����<߾.��)����I�^����G�v�u�e˳nc�cef�$�����bb\�߆ͣ����}��ޓ�|w��1>�}Q��wj���d����� ���_$;��18�@_��o)��-t�[�� ����:M��!NF�\�˓7$du5o�������ܳq����˻|\ka�v���1$���>��{�O�6/�[eѓcg�+��]�<27��7�Z���|
�$����v�������{]��܋u��y�����&�AT������	FV����Af1<|�����<5D��0��(x)������5s�|��s��PB�JԻ{'�+�7����bueqovqou�-��,X �+Ra�0�"�P� _�P�c��z�D��P0��&@��	;Ъ�~?�bZe���i���'��_j���e�2dH�'E*���1�5�S&7�Dc9��״��[���������M����n�7�ڸ����S/WƼo��"���~�2Χ�k�[#t�7&I4<�g.S�2%t�s�^5}��������S�/|ᯪx�6"L��L:g+q���bjuD����8ׁeiXQ6��O�s���!zЉ��H.х��F0�'�V6��eܞE���V�{sT��[<y-�U�����ZEk��莾�)��X|xܑ�hh��u��t�~U�@n�5\<r�Ͱ廻�27)�[w����p�a�~�ٻ�G"(<N�����r�cW��n/���P�e�nM��<�^Z-�x��k�����,i�@� aR�_�_D��^�����:��q��T<8 Z�� �Ϡ�H'�7~��ڔ;e��;�3"?q F����SR��o�����z�����o�w>��3�̧v�0��\K�nիV�LaF �m�N����צw�7ٻf��H���h)�=^�9��F��ݣ�n��t�-��?į.�rm�G�ߛm8���ϟ���cq����e�ݻcĳ��%vw.��%}��~��r����	����e��ˉx�_�"�U��@��� �ؾ��C��n��<����]�;�õ�:r�?�b'��?���.�ǟ}�z~������&�fm��� ��D�4�Y��\$�dx���&'Gug�s���\2�����H'���Ik_�/H9굜3��������Y������!ɮ�S)�]��vDǩh���DC�F�V�!P�-Y6�G��,���Z���P���Uy�[�	T����'Ҟ����Th`_�E;��D1U_�=d8��z��;�ZoÂ�։:�Ts��(���Yi(\#�Er�}�#��Vn��#�&� ��ԸO\��� k&q�&$��^M|v��4�j7�c�t\lw�9]'���d_$:��gԫ��BL欈,&��S-[��K��
7�D	S��]#Z�#@b	s���L�qY�����+p$ʁe�&nd�%�N�
-G�k:��f4#��E!zO�ꉌ��#f�?�u+q/El\q'������{��U?��y;�q��`cX��G�گG��x��,�\G)���E�^����*��W�(�X��Iգ�pJ��kHrު+o9W���_.gH�V�Qp��!�nh���x�*�=4�P3{KWr|7����QD�N�(�PT�jb�M�J�vٱ��sj����·!g7r�K	ʶ1�� ��S�ZUx����3���������������7݃b�p�s��m�>$�=��ɷn �3��"k)���Wʿo7�}�� �:K�����p�d��~ٵ~C�Z�"EȊu[�(�������=gY�?8}�[��fQ��Ѝ%�.�+:yK�~&&��.K�۲�NE�m�uJD�
�&;;m�v�_ ��tϽ��~������<X��Ŷ�����}�5�?%ɿ��oz�/|�t�f�[�3�����i�EuN�2�}w5���� ���-�?~�%�0��Q�~�<����2Ԍm�'��^�����s�m��S���ż\8�g��l�<>m��"J�n}z��_�=�׫�nv�mB�c��V����� \�|���'S�_FC9�hB�1�lv���1�g�a��S�{f6��i����!���X߈��E��f���52�3!l~�4Ul���=W o�����ajBGJ,��{������j�̰r�j�i٘� �nZxqAf'ؠ fQL��u���f�V�� 7,��p��\��@Ŀ� ����8�=��G�+�ĸrmğ�Úz�\t�J�����\�SP��$��U�}4}q��p�h�z5��"@ }�F�����xh�Z����AL�Z�tF��Tʇ��'��'#6W�L��Fm u�g
���\� �Or������h�0�r�뤝��Ym�/�F�%�x�xB��l�$��+8���؎_/*yWɗ+٬���ov��{��ӈ2 {���q#���b��~o*TX��z�KN��e~4���krE�L�F@HS�\�Ѧ�V��kx� 2Πh�;rqM�cq虏*.8�]��z5}�`���@��Q���J p��A�_G>����sqݭ��{<�-ȹ�̾>(�[,MEn��i�\9�~=zw�g��� .ٽ����,���z������(N��K��:��`D ���_���� �=?�kn۲r3�vt�oJ���K�?���-�2�:ݵ�ӵ� �?���v��j�|����Ős 	�#��鮶_鹞���rk������n�'*��l��:�1�b�
�y>t��<g��������߸İlt�1C~����~�������>��?��������������D,`=��?4Ͻpݸf����D��\[RM �<�%�����'�n͇ӻwm� �[��ܻ�P�3�l���;�  ?:����u�<��\~��?��/x�?�ڽ��66�����������H4-���~�nk�4�����=��� �Z �
t�1!���?���p�Dƣ���F���Q�tOVc���9��
��x�F~�[��C/�ͦ���T^�\�͢�?ގ��W�� i�)t�ݙY_Sq"���ޡ�7�}K˘#�y)o�u˓���՟s���ܺ�|��[��ڷ��P96ɗEϳ��;����0A����nm�~߽���b��Z�7��l͚I�W�j�T\�p5P�ƴ@���?r�j�T��uɉ��E����|*��yZ#�_E0�]�&���"�Â�-���� �۲��j$g�f7�q�^7��x��ʐ�T��Q��_��a�J��,�>-avы>��Y�-ڹ�u�R̍��x�Tʵ�؀�5>�F�Tܒǎ��L�mሳ�<���sQ��f�H���X�dZ�ܿr�Uݱ�kD����ͧG7k3yԺ��j���"$E�r�G;�t���U��>g&�p����]O���=�k��t�5`����e�ֺۀ.LU�5]�j�r�%�U\�IsU0�BDy%Y[�fd��^$.Vuz�۠9�d8�w��=����$����qUK�@� �������uF�gv���=Íۻ?�v�����V�1 @�~��1�i0Y�y��U׋��m�dl�Vi����x�N�:`.|r��G]���˒��}4e�y96�kk�|������܀?yd�Q�A�p}ˎ}ޯ;�[.5ީZ�dI��z�HҶ��ާ����t����p'���uH�S���0��^�W���n�6�n��H�����ȂH��攴�V'�%��ֺI���q�����L���k���?�� ��`���,	�dT�Y/�}o��i5�}� 7�>����r���ж���Q;�q��=���Q5��xw-Z���� ���{����8���M�� �� ������/�=�nU��ɖ]�� �o2 �u�W�I�]g���=/�?�}�Ѕ����ό�v{���[�2����F����e�O�?H�>圍����g�1���<K;,Nĺ� AЈ����u�:OO׫���]��ܻwp�ͳ*��߽{
��Nr5��c�I:�Rm}�ۇO�g�⻗�w�a�[�ͷ#���FN�vP�$x�ᕹyQu�ז�Y� m�� ��Ծ����v���^��˛)����Q����8�6�D~�d�Đ��\q���n��_��X���V[��-�J��W�k��psn%�y�fW��������LQ��O�n�������F��>E��]S;5j�� �yduݐv�x���-�+[�I��C�@>��M#����gt���"�����߱h����u8{+�<�L��b�m�H�oS�ehv�$���e�"�"{4@��J��>��w�/f� hT�Ӭ��a�.���Vsg��b���M�s��Ae<��8�х�>�~!�M��4������\��K3F��hi��݌�\bbD�15s�e��LC��TC�}G��M�Yt8�蔊�b\��Qb �� ��8
�^){.�,k�� �;����}IF�v2��)c��\��	rt�Iԣ'?�a��n�GVUf7��iZ,�y]�,��9]��'�d�Vl�Z�o`���᫮v����P~+9n�~�
rUH�C��V.X;�q�ϖ%M�q�v|.��q�k	�f��l�՗}5yy�q0�%#"I+��v�ܕ�J,hbC��|�]�7���Z��ݛz�h�k���/R�naP�}j̥X�c���I� �M���K_������ o=QƼ}�����pt*�S��{{����;wY��l�l��!��n�H[���~��I��7��{��o����_K{o��� ��o���x��	��@�Z��[��Tԯ���w���_�k$��k����OG@	q7��3�6�^���;[\���]�.�C�j�^N�b��L��X��~U@t�7z�����ߎu�
9��[�.g�m��C�u_�,=�>�{�O��u�.߹���?fwNvoxo�Č}���`b�/;�6ĮNF��������d���_;�}��6���v��~�׷~��=�x��>�۶���z#{"R�+׺�� �k��m�ח[gn�<���ar���bIa��1�iѝ~��Z�`��*>�7�G]x.ݖ�7;`JЍ@&\A:(�Y���׺�J�<��X�!�jL���A<|
��t�X�ߘ:	��Eo.~,N��헺�|���\x�l���W�U����-�%PBϕ��߆r���;>ݾ�e�{����O3mȹ�v`Rf�a1� ��_F\̾l�׸��-���J�o�d��ra�ݕ [��M�+ѽ��iD4��0��n��{n|���׷l����.��Dj*(�3[��I�4X�����(�T�PiٲC�D^��Ub?���u�;�QUA��a]�-żB�%G7�v��n2�-���%��%~-k6k��0���2���8��0�z-��^K��腻f��ơƾ�zYR�0h��7I�}9%P�2�
�Fw��G4ȄK7�A.���V1dgpDsSk�u�� ��/#����=��ε?$�N�r�τ^Շ�Q�3�~��ŻX�DU�-t�"N�`:x�G���+��<9$��R5���ج6�.�J,� ǢZ}'���jD�Gy�_p|�/F���R��Z&Z��x�c�&���$�z��|����i��|�	}i�K���E�u�K/$\ӗܐ���%˭93*�����P��4��I����h�%⁸�sD/�"��	ٔR|P^������m�н�e���dz-�1S�r_�n��.M����Ѿ>=��k�w�}�ca�y���������oF-{2� ���+���5+�ss��s�;O���O�׏\z��}�+x����~�\���� h��6�z�4��,#�ٻ�:�.�b<��kտ��c��܇@�h�SU��#�8�r���t�� �2��&�m�{��5�F�ߛ��=��~*
�Wɫ�1�.[&2�e�a���7��̰���Ɓ��[j�i�L9��߷�?,dF�a�\6�����l9Y��7�/�+W �G<k�q��^�����wv�p.�X	N�b֕ ��j�y1p����yQs���e�b�����WKsmg��a�B�d�y�]wc����nډ&��.�]��>�ٳ�{�b�޻�sχI7nDH� "~�����#���c�J�dD�0�e׫�W,voC=���2ѳ�6��?�e���ն���L�+���`�kF����-;x��A�gD��B��-�4P��S����NHW�YR���㺥���ZD+5�����B��d�n'��i��yv�G�����V��a�Pzx���;9��\�j�.^�+N�)t���.$�J�j���C�h��:
�!ܪ Y��EcbD��^�k�|�E��Ǌ�a��/ɘF]<ؤ�ݢV&9��Z�p\ X��g�@�{=�r��+�5�a�P/� zsVj�`axβ�/EpJ�f𠯚͎����:�A�g�?u�u��SΈ����MS�C#8��S��wg=�d�w5�^�c�ɼP�(0:��8�frƸI�9.��#��#ƥ�8��#q�q*arFFTL.PobA 9�P�Е�p W]�KF��A�i��ڪ�D$
�{P/�E!��\� ��}�,M���r������40��*�We�� �g��������~��_+޽l��]�tЂ�����_b[���y���-B�-˧� Q�_3���l��;��B�ã��X�s�f��9�3�&�<�G_�����ph��Ͷ��,lۓ�c��v�8]c^��5,I��q���1/�Z�����\z�X.���J��3#g7�T��jrj����ӟcm?.=2�'��9��Y�k~����ˋ��YPhx�p+_\�ؽ����F>�s?ٻ�y���X��͇.>����_yy1}\~&��c�A/�ъ�k^�^<tt�V6V|ctx
L��}Y{�x���>?���Y?��>ˀ���z�$�$�����|_sGc���'�#�͋2�l_�@�e�I�=S-t�z#�J�����<8&��D@h	1(����sA.�Fr��[�:��@x�����h��؁��g�W?�zu�����z������$K˨��I#�
Va
F,����V7Q��A�1nDG�������Fd�j��ƵY�
U�w� ���&U}�T_�]��;�k�s��ߙ���|!ë5�S=g�����Ǆ_ˊ�*U�x㭺�����+Řэ%��Lc6���]��sk�z�F�1� D�b�oj��^_�v�n��O�F�\/����\�sf78X�/�Ct�2��nsDe�BZ��i�|��o>ث�K�nr������8��Z��cu���|i�%-��`IO�/4y�~��j�4b�/��D���s��+��3fz�ǚ�#��P����b��/���jVl����k���+Yϣ�~� =��<�VI{VzwfͶ����U᪷[�P�%nDN&�!�YEϢ*BG�J$Pj.VmF<
� ��
�\|5@�>ꁼR*!W���ۛWt�X{+��7Ⱥ�c·n4h���;�4��}x���H���&$-a�DG�,Y�� ��_}��{�Q���Cwɲ1�"LcE��Nӥq�.܍۝r��TF�5��n��uv���\����>�R`x:�nGM��d�#�<"s��X��ܙʓv��]u�>�GK��D�dD��r�]��&��W���^���^�^; ��ȴЉ���T��M%;�M���D���>F�W���bDj#��Mw˅�i刎���3��S]-��c1�eI=AT�g�5�����n����`�P�"ejܿ�� �qM-����r�Y�n��l� 8p�ϒ�=�|�ub��ٝAU@�ӏ*�t�1)mR��
a<a�Vm�*��3/C���VO$Ȑα3�|%\�1j�ߢ`��C&W-Y�8�C�H���?ȭ�]ٛ�����߅�w���m���#�:��b������������������]͍�dC�02�p�t��u����=�z�w�nG�ܜZ�5��ʹh֣�3a�j�	i�\�"�J��V0aMhD�;{c�FԾ�y@��x�L��.~y����:��'z	�h��~� r��������8pG�ַ$��j��s�cv@D�r׋?/�7	����/T�9e�wV�x�Z꧚�9��t��$��7z�%r�[6N\̌�>+�q��ڙr�_�P�v^y �p�1?�t5�dO&S	��{3u�yZ��.����c���!���b70���ok,. dj����������à ��]���p�0�<4QT�~�t���v8����&�n�0� 	}]Vn++o�^,9�����	��Y��³���!�p����1٫cw�||��7��TEV���Zϼ���[.�(��?��V/�O齮?6z{��T���������c⧒�M���v���V%�s�~]ؘLk�>��%���쪧�#�� ��Hz��X�܃��$���� j� H�[�;���6v�"m�2_��!C�m���ܾw�߶�ϯ�4ĻW�c��T�Եj]|��:�n�Nԃ��ܳ*�01gr� |8��V����\��
6�\n΍5�)	?�L��G��� 9��mYYO7G����u��j��s٫hFu�h��|�}\-��_���T�re�^�Z$J#�;>+Yc��� ��D�o�]lͯ�⵫��=���᧝x-UӤg_�r	�H��p���n�-�q"Fٕtwz�\{�o��]r�ـ^+�?$M��� m ��B�Ý(��j7��m�b�QZ���E�������!I�3r�r��.��A�ׂ��N���מ���߲;�i�W&"-�G8�ק�O��t������x;��勸yſ㤞�}ދ96�^�{�{�On{_���W���K�?��ڷ6������u��k���v�w���ݛnW��d@��}񙕛J���p.9ǚ�b����b��~-,l�7�;OF4Fp�y�>�X�������܂����Mً� ��}���GK�t惽�M����ܹV�);7�uC��AdhX�g�����k����4L.Z6;^E��s���YZ�R٠�}U�\.��ql���	��{a��)�lb���à0֊��ֻ_lM�\h�S�ĥ��}��+Ŗq���G�;��:Jx�sY?L�{��@��b�k'e�m��s܏8��RƧ&ѝs*mӓjV�4�ङt��!�g'IN��&�f���ƑE^Ź`���H��NJ#���9��df�w�o���E�9����I��u\:ݗd�Ȕa�dH=N�Y���i�mg21����ƹ�$�G޷4����묹�����&�+'��f6��:.���w7��~�緕�&� ���{�K�[��T�v\����r6��RŚv��� ����qm�� t� w��7��h����ryj���L��տ���:�)v��7/�V�����c'�+�&��0������z��H �P�# �:pTI�H,�N�n�{�"�H�yBL�})�[t6��nǇ\1mFӞ`|F��MW�������7�:�譁r7�h������.d4"+�p亲5��m��(�q���˞�Z����[6�[�8�N�'f������S�,�{X1�1px3'��,����hWI0��o�Z�[wiZhK����/U� >(� U�
ӞNrȂ�BZ�8���@��+���JBD����jU��~��mê���]y����<vN��{kk̆�Ք�ܐ �RV�8���߳��q��$/��r=(#����[�0NP!"<� ��d	���!8uD�h3���w�A�S;���v�jb�GIj�H�Ͽ� �̸|̍�=`9 
���W�o=��v��[ȱ#�vV[�~��{�Ö2�����%�A=.9�_+.c��m��G`���X}�lܰZ?��2��SR=]w������?���m{���[�;� �{���2��L�ù��-Y�3�#2� ���G,vi@��:Ɂ-d߱���Q��r�:^<���Q�Ӛ	����X�ٙ?�l�uN�ͽ�p���Y041�7r�C��Ǝ��ã�;�g^yTQ��������c��"8x+�L��g����R��n�Z�QW��P�R5���6�p` �a�Bt���Q� j 8f�R�N-.�y,�+Gx�H�kXǃ�-%����º�6�Z���W!��i=����ی��2�d��Fћ.cEπt\�-���g�9Y����%��5�<N,��GH�VS��\�^ۼaH�p��b(g �LƾOugoȧ�h_�\F��R�,�n��4	�����9�1~>+Q�ر��& �@�Z�5�&�p�x����o�l��3W�ͷq�l��ڿl�"�D����f�����kf��m7/��z��͠O���$�32�^\�o��;��oq����=��1E".���m�8����~�����ɿx�q}!ر/w� �;O,�6���2|.��z�w������Y�5�-���]g�^�����l�3���ƿ�������|A.�w�g����lg��qwm���b��Y�J�ȘLy� V%�2��#�(ܜM}�������^׍8��wNE��,��/�˟6�:Z�}}<�#�<,�V���%�2�?K�iY��#�
��|B��g1��
k�W�h�6��$�g8[�]�-�N1�'�J����醌m<Z��ⷆ2yX�"�#�mV���H!�3�ِ��ּ��r��)[�Yn\1��n�P$̀x=����!!X�m�L����r�L��|V�=-�C3�P
ۘ��ap*MF�I�GE�]Ǐ@�`����lW��[���5�|���A�5t ���@�Ob���B1�d8<Bc��@9[���ꢵ�W&�FvV�n�H�}UW�M6-�����DJ@�@*ˇ�}��9J�^�H qSt��;7�;r졓bS���>���Ke�=�b�[N]�,�����%��:.�޹����o�����v�v�츏�-���<�R=뷔�� w��NW[;v� ^���.վ��p-gG:����L��� SKzά]�� ��,N�7��S�{�4��;�t<GL��<IbR�u����XU�,_�KN~�!��9H�䯙C��l��/Z�רt�U�)Yu�;~�y��ŏ	2�7�~����:�Գ�t�Y���l4�^l�6�c* �ЪdX��8��C#���0�
.V���<t��"�0�h�(k`�˂��(t�S+l�n�
�5�� ��B����q��9�""�q䀢�|b`U�aE6�hUB�e�A�$EL��"&7,�C����n� K�{syK0��TI�)�e�nF�[&{fd�u�B`���{+���uF&��Zy��6��n;l�s�� ?Sĵ�n�l!�p����Xe����^�]���Wشz�>³E�fL\�3���-�lL�r���o"�(]��O�
棅�����vY�m�ݿ�H�2����.x���|g�K�9�z˝��:�ϡ]�;f=O~m�}����:�ɴ|J�m>� �ݹ=q����x/u�%퍾���x�����H�q�-�i���ȴ�Vq?��r�\�����\V���ǖ~�k���:�y�ߎcG������x�i�ۯ�����g��)n��M��̴a�w�+w � ���!���72G��X�ףm�.�݋~�Aȯ��������ٮN���B�c�����fP5mte�|�؛=�@J'�~U���j�O��a���KP�<]\(�1���L1��lI��\�sl���0b�+���!��GP@(�o������=Ѕ�D����kP����&0�P5<�%�?�ӸN忓���J5M7p���Xȕ��Њ�տ%����q�z��I}jm��y�wg��8�/���|>]|vK�>�nh����5Q�y�gq�ڌ�3�p�J�C�I��'.�N>SW�0cj�\�x����;U����Z"���W�]�{�r��xui0�L56��>�� �l��8K��[L5�^�v����e�����v�)�%���]�2��3���.��]5�\w�^鈴�^0�>,�;5���GT����{@!�'U��d �n2�!�LC5���3c��q����xGO9�y?K>Q2�2�f\���,^��岞��f54,��<*�'w�Ő��r��R���8�u[wpl���oF$���\�6�c�e based off of range
            }
            displayEventEnd = options.displayEventEnd;
            if (displayEventEnd == null) {
                displayEventEnd = this.computeDisplayEventEnd(); // might be based off of range
            }
            this.displayEventTime = displayEventTime;
            this.displayEventEnd = displayEventEnd;
        };
        // Renders and assigns an `el` property for each foreground event segment.
        // Only returns segments that successfully rendered.
        FgEventRenderer.prototype.renderSegEls = function (segs, mirrorInfo) {
            var html = '';
            var i;
            if (segs.length) { // don't build an empty html string
                // build a large concatenation of event segment HTML
                for (i = 0; i < segs.length; i++) {
                    html += this.renderSegHtml(segs[i], mirrorInfo);
                }
                // Grab individual elements from the combined HTML string. Use each as the default rendering.
                // Then, compute the 'el' for each segment. An el might be null if the eventRender callback returned false.
                htmlToElements(html).forEach(function (el, i) {
                    var seg = segs[i];
                    if (el) {
                        seg.el = el;
                    }
                });
                segs = filterSegsViaEls(this.context, segs, Boolean(mirrorInfo));
            }
            return segs;
        };
        // Generic utility for generating the HTML classNames for an event segment's element
        FgEventRenderer.prototype.getSegClasses = function (seg, isDraggable, isResizable, mirrorInfo) {
            var classes = [
                'fc-event',
                seg.isStart ? 'fc-start' : 'fc-not-start',
                seg.isEnd ? 'fc-end' : 'fc-not-end'
            ].concat(seg.eventRange.ui.classNames);
            if (isDraggable) {
                classes.push('fc-draggable');
            }
            if (isResizable) {
                classes.push('fc-resizable');
            }
            if (mirrorInfo) {
                classes.push('fc-mirror');
                if (mirrorInfo.isDragging) {
                    classes.push('fc-dragging');
                }
                if (mirrorInfo.isResizing) {
                    classes.push('fc-resizing');
                }
            }
            return classes;
        };
        // Compute the text that should be displayed on an event's element.
        // `range` can be the Event object itself, or something range-like, with at least a `start`.
        // If event times are disabled, or the event has no time, will return a blank string.
        // If not specified, formatter will default to the eventTimeFormat setting,
        // and displayEnd will default to the displayEventEnd setting.
        FgEventRenderer.prototype.getTimeText = function (eventRange, formatter, displayEnd) {
            var def = eventRange.def, instance = eventRange.instance;
            return this._getTimeText(instance.range.start, def.hasEnd ? instance.range.end : null, def.allDay, formatter, displayEnd, instance.forcedStartTzo, instance.forcedEndTzo);
        };
        FgEventRenderer.prototype._getTimeText = function (start, end, allDay, formatter, displayEnd, forcedStartTzo, forcedEndTzo) {
            var dateEnv = this.context.dateEnv;
            if (formatter == null) {
                formatter = this.eventTimeFormat;
            }
            if (displayEnd == null) {
                displayEnd = this.displayEventEnd;
            }
            if (this.displayEventTime && !allDay) {
                if (displayEnd && end) {
                    return dateEnv.formatRange(start, end, formatter, {
                        forcedStartTzo: forcedStartTzo,
                        forcedEndTzo: forcedEndTzo
                    });
                }
                else {
                    return dateEnv.format(start, formatter, {
                        forcedTzo: forcedStartTzo
                    });
                }
            }
            return '';
        };
        FgEventRenderer.prototype.computeEventTimeFormat = function () {
            return {
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true
            };
        };
        FgEventRenderer.prototype.computeDisplayEventTime = function () {
            return true;
        };
        FgEventRenderer.prototype.computeDisplayEventEnd = function () {
            return true;
        };
        // Utility for generating event skin-related CSS properties
        FgEventRenderer.prototype.getSkinCss = function (ui) {
            return {
                'background-color': ui.backgroundColor,
                'border-color': ui.borderColor,
                color: ui.textColor
            };
        };
        FgEventRenderer.prototype.sortEventSegs = function (segs) {
            var specs = this.context.eventOrderSpecs;
            var objs = segs.map(buildSegCompareObj);
            objs.sort(function (obj0, obj1) {
                return compareByFieldSpecs(obj0, obj1, specs);
            });
            return objs.map(function (c) {
                return c._seg;
            });
        };
        FgEventRenderer.prototype.computeSizes = function (force) {
            if (force || this.isSizeDirty) {
                this.computeSegSizes(this.segs);
            }
        };
        FgEventRenderer.prototype.assignSizes = function (force) {
            if (force || this.isSizeDirty) {
                this.assignSegSizes(this.segs);
                this.isSizeDirty = false;
            }
        };
        FgEventRenderer.prototype.computeSegSizes = function (segs) {
        };
        FgEventRenderer.prototype.assignSegSizes = function (segs) {
        };
        // Manipulation on rendered segs
        FgEventRenderer.prototype.hideByHash = function (hash) {
            if (hash) {
                for (var _i = 0, _a = this.segs; _i < _a.length; _i++) {
                    var seg = _a[_i];
                    if (hash[seg.eventRange.instance.instanceId]) {
                        seg.el.style.visibility = 'hidden';
                    }
                }
            }
        };
        FgEventRenderer.prototype.showByHash = function (hash) {
            if (hash) {
                for (var _i = 0, _a = this.segs; _i < _a.length; _i++) {
                    var seg = _a[_i];
                    if (hash[seg.eventRange.instance.instanceId]) {
                        seg.el.style.visibility = '';
                    }
                }
            }
        };
        FgEventRenderer.prototype.selectByInstanceId = function (instanceId) {
            if (instanceId) {
                for (var _i = 0, _a = this.segs; _i < _a.length; _i++) {
                    var seg = _a[_i];
                    var eventInstance = seg.eventRange.instance;
                    if (eventInstance && eventInstance.instanceId === instanceId &&
                        seg.el // necessary?
                    ) {
                        seg.el.classList.add('fc-selected');
                    }
                }
            }
        };
        FgEventRenderer.prototype.unselectByInstanceId = function (instanceId) {
            if (instanceId) {
                for (var _i = 0, _a = this.segs; _i < _a.length; _i++) {
                    var seg = _a[_i];
                    if (seg.el) { // necessary?
                        seg.el.classList.remove('fc-selected');
                    }
                }
            }
        };
        return FgEventRenderer;
    }());
    // returns a object with all primitive props that can be compared
    function buildSegCompareObj(seg) {
        var eventDef = seg.eventRange.def;
        var range = seg.eventRange.instance.range;
        var start = range.start ? range.start.valueOf() : 0; // TODO: better support for open-range events
        var end = range.end ? range.end.valueOf() : 0; // "
        return __assign({}, eventDef.extendedProps, eventDef, { id: eventDef.publicId, start: start,
            end:V�G���,��:��4�K��Y��P��c9�J&G�+P�q(ef��ta�8P�,B��~Ehٌ�VA8c�?����$�7�.�	��<<LY����-����P#f2~c��5,��U���B"�Fŉ�oc��4..\����b���ɸ�!2��o#��z���4��%r` {�b-rȷL~0ʤ�_����`��8&'��aL���v�;�G���U,k�:�=�&"xסv?�~�;��v5##<Xt��^�Ygc2�/�H4�݈��&Rޘ��9�J~��eOp"]���O��Ǒ,�\�a�b����G+�/i��wf˴cN�>_u��vb~Vnm�Z˅������mD�U˓�m���c~-l�Y�^�ڸ ���,\���zt������v�day6�X@:qɷ��_G�_��z����\���W����^l�v�[/*.wWy�C�]�c�L56!d�X������֣�Uf��@\�x�Kz3�-jp�X�kr�w�.|�Vb^���� �z�y-�"u��e�WGL@��0a�L�n!�r$�Ƥ��[ֹ�{.��h�X.��$1r~dg�Q����:qo}6l�m�"�a�r����}����CǸ7<V������/"�?r�7ȉ����L5}S0�F�M��J���PF}B��9��n`��C7ށ��D�=-�� so>(R:8 �QƁ�8�Q�Ї�B J�����(em���A�Tq� ��z���,I�/  5Q�\���+��쑓��܀\Jq��n��P�ǒ1�c�C������`z\(e!�i@X��X��8�jL��L,C�Uj=�\U��2v=�.=�݌��9X�������;`3�nx�N��X,����V5���m��m;�π�a:3c^3�+� tl� ����-����nn͍�vL�#zG�3U�Y�.5����ޅ��D�>
��"ͧ%�bQ'�ب�	X�U�Q�ǋ��fsς�d��T�q�# c2c�V0�jj\(н��ڢ�(�!c���[ꁾL	4���%� ҈�$�#�|�Ao���e
%��Ŷ]�U�!>utYT36]�(t�bB�<DC���f}<��ZǑ:j+�UɈû��}ۥ+�>i TF0$�h��x�;��m˧6��Ǝ���Quk9�� �om�÷̋{��{|ei�E����m����O�rȑ��z�@�'v`u�p�i��7�g3�w�nۖM�r/�Wo�u���o��[oVU�ӑ�>9>����{����O��\�ڮ[�D���q/A��~T�����>���X�9#� j�z?=B�����}����흟�z�,潌���:�ȯ���.�gW�O�+��q�Ǯԁ<x.�{u�!���Xä�����Y��P�K�LD/ی��S�f����bk���00��A�eFp�&�ד����9��'��$Q��%1���ڻb27A���]p㽗�O[�Į��U�a��cr�������xWy�y��WS�޷+��%P9/o�����1�c!��.�:�Vϵe����{�b���b�o˹�xp�`�]׷� ҽ�C��j�P��>v�ܰ'�gS&�g�"?;�K�nQ\�[W�_�U���p�*�~�b?4�}�j���a�<�	�,��_�"$7�$>��2�)6��!���q������a�4��_�����B�Q�qZx��&q!(�@H(JQ��E&�7iDJ:"��{ra�MT�<Ǐ�BܠkBy�`X��>�'+6���(���u�ͬc�=��ۤ�p��u���O��n^� ���r7;u�bF��y�ptŋ�T���3��~n��c���6B��S�+{w�]�W#c|Ĺ�IJQ,�,V啌Wo���.�ps-�$�%�U2ض#F���0�~�2"b"A��*�J��_�"`alp$(��N&b@:sCux���䀑�Ê	<7(j �A/�x�|�AbEx���S�8VbM����C�� ��W��b?���.��蝱8��EL���u���m��E#v�����^=%�{1�{׆�`\�s�)�)׫^<|�F-��p��ϥ�VF2v�B��n�8SO[z)fع	�	 U���A�T#�xfN��Ո��3�"�U�o8�m[�3�Z����9�z�߻��(�Y8Ro����������ڽ\?bΕ�.���a��Ř�d(x���8��⾮����'h���
�^�Yy0�jt��קZ�����],V�ߔj�4X�ɐ��D�ǈQ*�I��|D��g
��"�"DV��M�Wu��2aA�nl��`�R�+�i�ɋ��@(|��6e�v�D��6\>L�����sLL�bC�������^����@�� V���Lg���Q����6h��,D�����0e�{��k��sn؟ʡ��/P�Gz��S�u�$y(`��,�i|��n��q�-�*{֙�hb��odHZ9���"&������2m����DRv�&=��&�-��h�]-�O�Ue�5g�"t�!�'�.8r���� �2�<�hFq`e�8�Py�l7# ꋁ>T�@�Í�2_����Hr��ͩ�=&9\!��GQ��1��1m��k"fؠ#�P�#�N>
�|�y��S*qk�uŨ��č�����2	�����-�t���0��P��$��)c^NW7�/oݔ�m3��dk	Y��� ���|��Z=���'ŷ��rǏ��zf[��jͯ�d�z�{lŞ�ۮ�L>`���=�y���`wfǜD#�w����|����-N3�\�O��U�8��׀E2#Z���`�Q-����$���∜O�r(�	p�(&MY�$�QZp@�.c^h���x"%�y?�*�8���G��l��k�s}����%��K�C��V���k�{�~�̹s2�����z9ms\�ܣ��I�|	bϱ�D��:��I�V���2&L���x*���u�?'�[�*�gb�B��ܙ=o��G5�[�Y��x��d���5ln}V���CG�H�u~�;�n~�?����a�mǛ۷a��3,N������i9&+�7���w��o#�d$��<���\�WK��<{�{ uĆ��׮\3�a�H�<Gƻ�e���U����V�r��I��
�3c�	n*Ԋ]Br������rܘ[�#t�Ю���ހb���匆.u��cNmk�f,��W��<h��N�x>����e�|b�DzE�*�9h#^!��px�Q叝
*BU�@��8[����0uC�T����n��0�jei�����XM��#wiλ�pT
�?��>�r������H��)�ޓ6��*a��qۦ!�l�a���&?�f?|F�}��`��yte�ۯ'�Sƙà��c&�B��Vf&� I+&N�Nx�4ED�?�Ǉ ���0W���4��P������\�l�Tv>0�!��<Q(��#�h�u��Rў��~��?�v�7�����`��5T�Q�$�uԙpL&F�cH|'�S
Q�M4�E9�b9#FpB��(���EN1��N9H$���ܕDg�.�ژ��-ap=\)�agv7o��X�����#� ix���a]�=�j��v���Qb�d� ��U�3����݀��5˶b���7���eLV�����:a+��]Q�u0:�=�2"�=�]:(ev7���y�#;dj�|<"@�#�$B'R��� �5�t�5�	R���'Va�-B%8�wc2<e"{�<� yPx��㻫�p��{3ʘ=1>eo]-�Y��^#��#"w���/H�#@<�Og+mbe_��`��!�����j¿1")	0c~)լ�VoëR��3�.b��z@ꏇ�\�K�e!$MI�Uc\Ǟ4� ��@S:�q�z�TX���yrL$��1B���C+xׅ�c-]��G�<����2�c�帵�H�ǐD�]������ґۧ1�~C�s�㜚������}'��63�m�ژ1�A1��~w}|n+��r5����YU�����_�k�agH����=W:�[�DuM���n� !*Ʊ��&
<e)TD��z��g0�$��HŸ|�\�n�^ ����zkm� �ۿq/��g�����}q����f�Q��.�9:1t*RT����8}�Z�n�C�n�p��5Ct�v/�:V�=�\F�x@��hA>��RD�*�q74��;W!�zp4"Q��e���=��<�aB��Cr�6�� ƞ婵�X��ٱs�컝�i�"3�혟rן���ԭ�=���K�˹(d.�������|�	|�� b��!Cs�� �?�����%l`��h�Ѹ�f�9�6'��x���J�XǕ���$�a�XZ5?P��8�ɓ�q�Z��`vN$h��^H�/�I��A�2*b�u���	s��Q��fn,��ũ�*}�|��8<q�$e���L�蛹m� ��I��?[�s����	�1���d#�1-�T�bg:����L!�InEO��Р]w�D�_2�)6��
	��b$�_�$<[�0e������r�l�G���� Ɖ��G�;v$nl[��)����e.����� �Qv&�Gq���AϦ��&���_'q»�t~��k	1L&].��;ny6�ɝmL���� L����f7���w���TbA�U KM[QD&/�Π�R��l@7P��D�XG��eٕD���3�]Ǖ��+[}���*@�e�M%�N����ݲ�/d�u��:��^�c��5�dbFS1�"$��ћl+X�z!.�)�hދ,呼m�=�V��첨�ܹE�	��հ��j 1p��z�z��T��Svk		\��4P�U���"��Y��Q����(u	R-B�Hз���fՠ���ܝ�w�������<K�W���b����#����Z��>��|�N{d�`uX&�^����g�}o�˝q��:"��j����V�S;2_.P�:h���zi��w�dE�և�p�a�Jh�ۼ��jK�n�Y"!���x�[���n1 9c/�z.�9�4DY�Kp�"[����{��k�O倩4�^=|�c���L�R�E���?D"!�`E������P[�U�>T�"'���8���TbO@1����h����`��*Δ�: z=xz���tA�uo
�n�g�Q��p(L�9j�OH����C��'�8�$����;����C�ǈ�P���8��o���z&a���`N-�\ ��;C�����ۄ���ȿ>�P�6�e�����Y`�\5!��J�!�F�QQ������R�G�L�Ddۈ�vi?�R��S# :� �� dk'Dȑv2���(��;��E�Q.�Q5��*B1���\1�[��	t����	b�A�nZ�D���*��Ȥe�yLW�#���)V���XS�k_"���MC6�.�C�=C��!�KU�"����t(q�Ƽ��ܪ	j2�虉��_qP\�EǨ,�YX�Y��{�5�����`�� p��0�{7�����Ĺ��	�� �\qWʝ?�~��bNɺ�ʵ��L�4�cw�'Ѕ|���q�}ɴtø�K�����y�C�rt,��S�{6��gj|!8�� ��4�r��S�,����c-�Wi���yk�D����p����X�+�'�yE���!��K���՜���n��%ۘR�/e_��n�n��z�����_�������Ź	\y�Z�Lן\��� I1'���R˷Ā1��Q��1m;�ᖼ�UQ�&뎢�$�.D�|����:z�
�p��#�������cH��~��jO�2w[�d�P��!��#�Q�.u��o�#YFٸ%��F�!U�X��NQ�� �~��n#k��ٷ�}��l�@q��y%�mq��ſ�������Y�%_�C���k㵏�q^����2�B���l�{�X3�\6�f�1��m\454X��una�q*�p뮯.�8�J$ɀ��v�l$��ʃ�M  T�N���n�7�7h��ʅ��m]�ϕk4ڔ�����	�EW��K#��u�|c��pw}�s��n>T��&�U�|˭��٩�c�d�ԉ6�
�@�0�(ߚ�DI��65� ��B�*�DC
�K�/�j
��d�ѽH�~��!��@�j$zub������ o��@�5��A:8j�
	0nO�t�x��P������C�.�YY��r�����1&��Қ���-���'�������L<A1�|bbj%�W,��cf#�"Q4I���$�`�7�J�"k� ގ(P�$/��P���_r7�X�܋Fq2��iCU�B[][Oz�S��"�y"d�Q#_B�K�WQ� �
�Wᓷ:�@\fg���!�B�!�.�ۡч�P<�9�ڊl����#0z��v��� �2����Y*	�b8��s��UKP҈���3�<-�ܧ~��j�ٵ��P>�m;<.�mٱ�C1c��6]g�\W���Ռ\���ܺo]�rԋ�k�=�vϬ6�LY�j|EӢ|Q靯����2"!V����σ�����w8D�q�P���t���ʇT@���g����nF��ܹZ�;���tL�_CE���,eYΰ�!��,�K��{r�ˑ�f&mj[��:�ɖ$�U߈>�}�xɅk����K����%Fq�8gxtM���SV������˚�b���#����]Z�"O��0������l& HW�Y�أ#d[��	H	GB�5䑼E�W����1��vd���pj9�?��m�[��M�t��e���Sկ���G�r��1o,��NV��4_#��&�}ϭ�u�F?��:��y����.G|�"H:�ˆ���s�9 i�!p����5���y.ڸ���ȶ@c���w�^{q�[{n'qB��c��A��{�v��Ϫ-��U�xx�z��o7?�B���܄ �o�m� t�Dd����zs=c���P/�5ޱ�nb��� ����ɾ����/�*��߷$a;�X���\M�,?� ��K^9����e���7w���[ɶ���O�̎b2x�u����_wK��D�|���0.��˶`�qpS��uf����c��̷��C&��V�.�%c�b���f��T1gނ--c&����D|A��\	я�VA Ơ��-P�uU�i��!2�ũB?Qw�P'$U~��2���� y�A���3�?\0r#���d��_��k����-��;kvk&f� �q,U��gΖ��{��ƾ�� �
���Z�=cP�H<gn@1��EL=�d�N��L-)B��9"m��J���J�Su�6�L;y?��ѧT@ы��\�
%0&2�6@�V�k�C�hC	��ڜ�� ,�yL$ctG^��@o.(΃����=�u.���Io��C�]\4S�0.ҋ�EP81��g�Ž)s!�h�tN��ނQ��$�3�PO� hc�"����⃝����흶�v}�jը�Jo�x&��bۈ�s���߹2�`l��cm����5�����k��;+p�˜�_�+���E��w�-ʿ�'C��`�L�\�e�~���0c3B������_P.���n\,p�v�g-�}K�=ۏ�X�cq���5M���z��%�>>+�f���ٲ-ږU�z���W��h�b�Ww��� m�?I4��ɧ�km}]�|c���$��+y�qaڄ��9 �]�G7e����U>�V���+��uc�)+�[nM���>j�֥��OFDU��׾!�Kԣ\����	~m|���'8�F��$�m��������Bwe��ɵ�~z�3�`��	F��,�U#RG�}"�lbeFg[�G*�o��[�vzE��[�e)��|���k�ݳ!~��ğʽZLF]���5���nU\����1��t~�t�4kv\�4�+���qߒF�Ŷ�[����Y�>co�D�r�\!E�x�5��|�_���I�ͨ�� �t���퇊�k���La�������J �b^b��DX�"`A��$�0hQ�}��n_���	��\�>L��0�-Ͷ���W?����۳�m���܈nR��|�㙿�ʹ��3�?� ��(���3s�Unm����y�1������������ͷ�s� p*�g����{:�Mn�}�BhnZk������X�u˰��\�S�����N�L�u�3�����g(��8��TFP����ơ[ʟ�wڈ3r(�2ͧ�z�$�9�&Uf�<�7� T��qv ԇ?n(�8�9���� �a��'���e���P�[�p4a�0��N���G�����r��k�%:z�N�����m�X�ɏ� m�1ӌO�5�K���Y�Mߦ3���A��||�%��*�g�t�ʀ��z3�jH�>�<���5��U&�5C$bMHx&(�>���&�mS�����L�Hw����LAj�� %܇�G�EJ1��"�Q"�� n��y)C|AqȢ��2`�\x�QH�!·��0q	�:�"d�$P��@S�����Hj���e��Ź�t|1�%������Ǻ^�����bF9JC��� ����'��_=�u�+�kt����b��H@� BR��Ph�n1�&%A�Z�+ܾ������q��뷣϶�}cڻ����&'��j��a�n6���	ꤸ�c����2�����,��kݦ�hܹ��gΖF$G�\�漛k��f+��q�N��?�2zq[���ɌKx�16�>X"�U�r������n@0y��]S���j�Dh���}�l�r!Ʀ'@�6Z̻�lH��%Y�
X��A��E�W*vR����o�,�b0x��#��Y��\�n�6݉��pOU׻��ǽnЛ��Ë(�u����&�w+6�l�H���O%�~�|>���`w�]���.�������|�ǵ�[�H�}\�����7��A�E� ��ַ��7�Y٫�b��s���Z۶�>s<W�O���^m��z�i�>�v�.\�+��� S&���$|dW����5�G��q�D��ܫ����8�ъ2 �GX �����Q�C@�=C�Ua;�� �
���	��qA>���S�		@�2!�n�ȅ��"$=p���-�,� �2� �G�\-yU�Ϧ���d�Fc��P�jnJ�6.���[~M�lp��l�ה��#Z��ۤ!�`��Y@W)�P��#g�6���e��+�qz/� �.��}:\]�oπ�U��5�&%��b�wE��kBE
dHHhK�"'��� DDHc�L\��"P�� ҋ־j��� pP��2�!ߧ�
��4p�R|�Fzo��$D��OL��*5��]�	�o��nr�UpӤ��i���bQj|ȓ �Ō�ev{~�Y���n����Y`<�>񛭏P�~�w4`3�C2�D�́�tĽ��7�.����É9�k����A1Yü��v�苘y6�ď�ۘ��3�a�����*S��$@:Iߊ�\��՛�El(⩃FR�^�$��T;%��ja�2�'hX�(��cJ{8����)rU�a1RTT����@n�,�2)�d>�6㮇�2<����s�{r�.��̀mB1֡�������W>��e��x�2M�js�zFS���%6�ۚ�͹��f�M�e�]�jdS��Ö���� ��Ň�l�U�]\�F��v�?ˈo�o��l�1�'��lt�1.�0-�jT(����7[�9�	��Mv�6e��Ү���-_��0�W��y��_J컝��1�.��m8����	�Y��o���	�A�Ԫ��)z�w�׽�ӳ&���Z�K�/ʿ��+���9��F�q���s�g-�`p��R7md�E� )�s���&���kr�vs�.6��)N�"G�׊�̳	Y�v�%eYs��I��m9%i�nq�4�ђ7�����3��X�V%1�2%�輛���>���֗l}ǈ���#2�\9��^�������m�#x��Q���W����n͍��[����G���bو1:8��eb6\�M)x�>�Aa �ˊ��i3� � �j��
Tp!$����%/�h)�(�Z�S�ǁa�*�S��ͪl���u�1�5��l��Y���N ��\�����"�ș��4"�7��9����J�ՙ��j��}�Os*R?P6 �;���c�E��k�j�Y����`�{��(���� L��^�,t[}v�y�X�t�j� ��� ɖ.�C�k&���ٹ��(�!�XdB��Q�3y��$��e�����N�!9.�j�,�ϒ-̉ŏ��6`X�mȀ��(�z�q1��Z��H�ٻ��XS�.�f>�������������Y�6���$�Mٛc�ψ.W\4�vߨ�$��lt3�[�Vz�<c����Ⱥ/�{���$"I�w��SsW�~�w#G>���� &�J���}_���B�T凐OHCG��m�.����%f�g�� AYF���.V2w�*�D1�*�2mY�J �<|�4~|*�@i�0���b��&8H��B�KQĢ��^-�� �ɷl|D8��?�p�#+��:�+^5�_<�D���=�7/�ƲOH��:ۮ�K�d�PٻKb�������2�ˍ�j�mY��g��c�S	ۦ�k&���]2����n߷)|ZJ5,y�����uE��r��z<�s��r4�tX�مvى�`5��������DI�Ѯ�m�_Q�<�y^�f���r댼�H��v�~�e��E���NYV���W*v��N�KXF6Ne�h?5�
�?���)���Y�cS�*�R�T�䎣Bj�Q�~ݼ�wI�s�~~Pm9.�F=�~�LÒ�=M�\�Xe���gu������Z3�Z�7=R����9�Z��D��(�vï��G�{R݈��U�5^K����v�~�@�ØU��ݜHA����j ?MA���U�#MTT��j�'҃�Px *}�q�=�&_���� C����w#�sL��mB`9vcV@� jx Q�y8A/�
&�^�0DD�>�$%>�(Gj��fٵ�2�a>�d��+-���n?M�L�8��i
�����.o#�{�i&�ə8������nrk{��;��v#ѹ⌛Q�S����
�zm�ĭ\��L���{
愘����6vf���Ϳ�6���j�G�	z�U��gx͖>Z��ք����vve�q�>�ݖ��cm��u��ގ���5֜t$���G_�[ݛ�!���܌]^�ۛu��P�X��⷇�2�B��Dt	 ��M������҄g(@�0�&�w�y6�_��A�z^�E���YМ����%�Qs;ro{|��?���L#�����o��؎#TJ�v��BC��wpnр-�W4�^��}\�,��M��cB���32�z&��{k��a�=��� O�+՟m��Vݸ lބƯ��a�o*��b>-�U���J��L`�T!�0z2&M���� �-9���77Lh���a2���|+�U���5g.'x�y�0�v�_vn�3.�Ft�e�ă�k������u���d�����z&}V���#������Ҫ�J�e���M�%�*xʞ9N�ɼ�*ubı�oݷg.�b�gL�X��^��I��"4���oc���r0�\�ud�c%�_ۯ]�Q�ػ��R��^�k�$����-B�[��r�u0�W��,9��gK��OUyf�K8^�y(��[�\��\B-w~\	�*�6�`�舚�*���u�E�\�8���GvŘ�1�>KR�0���A�Ҫ�v�[�� K�{���Yx�[��c�� ��c?��Vm�wm4�t�ݗ��5��m#2β�~�\.����=t�Z�p{�'��{]�I
�&p�Oj���k�_�o{flG��a#�ةe��.�7#8�<uY�"����	Ƶ(��8�⨘�O�$-�q�A.��$b?������ ~(���őN8:�1�_�@���
��fŦ�j��Pꁌ�?D����A��@�7#�1�܆�H;�0�����K���#���]&�F��8�����v\�L=������9���U�8���s�;b��ܔ"�?�n_u�l\>s��v�f#��m�խ�/om�cz�,Dڽ� �#rȶ	h�����`��j�����Y���c"ܢmՕ���>ф�d��Z
���i�^/���/��Y���]�э�'�c0�!(���`R��L��6�`K�"p�<Qp�6�۾(�!~��S	�o�}P���r�������b�n���]ܬ�/�o>��៹L��='f�����$O�2���R囥w=�eB$݉B
�f����f%�\��D@r�p[��.^=ݿ]6����5�z�z��w�^�ּ�v���ޔ�,�TMh\��b������y����YT���{w6K�^
�S⎇�;��]���_��z7�;�t��]�H��_��a�m���/Z1<|o��u8{�h�,x��l�z4 �h�U��l aE������6��"]�����q����.DU��L1�<s��8�S�C��\v�N�<�2��9<�0�lϦ@�����7#f� ,ōh��\��s��۪��^��+��g\Y�+ET�w@�4Z�+C*�1����Q��>�&���͜cn�'^)�󄌪��v[\~X\Z��,X�ܭ��2��z,�U�����
Un�1\Ws�S�ǧ�I�uv���%�Y��ˊ�\7�헡b��T,V���z/[���\=0�W�g`�&R�n��_�2��Ʀ�OUo�gr�&[V�.���� ���S�/����_r`����v��q��S��c�p�/��Ս{�/D��ռv%�����%nq�MhV֣pK�$Q#.�D�� ���G��?�����h�8��� ���O���(g
M�H�4L I��g�.�w"��*��EB��c�Ӻpxh�/.\�pd�ɴE��$���6kW��} ���Z�*�ӰwA���R������� >��N�4Z�<T�٪3m߀�?W�g�+�n>]�U�j&p����fH=p���:rW5�"�2��(���y:.\�;y��lIú�NW#��VN��%� �K��er�-�ؙ�ȳSE��-��H<� ���` g�"4��}�Կ�vP��\C8wݹ��(�V�#?$����rs�`Hܕ�U�+$pۗ5��Gq������u�Yr9K��{.Z�O�%��e���~�J䁐&�TO�Wa��'�nQꀧ0���K{;m�����:�ƕ�gɋk~�l`@7ˏ�2��r/�1�O��H�VmL�<�ʰc��t��-M�^U�gc���x�C����u;nD�z$����9��������8^��y-3c��v1(�DT;�6\漳�v�DN&��m/�<�zM=q�=�fiz�M��l�[�ׂ�5�]��)�E�*��^m��+ˤ?W�č�"7 �j���~�V�#��Q�������V+�����z�ۅ]l˫�o�՟Z�Q�ٺ.c�E��^�9m�0aH���Ѿ���ӱ�w����>��-���l�]�!q�.;\�GQx�8�7*��0�F�m�@��X�lĿ�T���\<��d،�T�
�b2.��$~<�1dK���4[�/�^T���p{!����$�b�˭��N�s���7<;�猺z��a_j��r���6���'��V,��Yݡ���py)�OGTH\��A.��CNH ���oj�T Dр��:�!O����&Hhƴ����%��PF��0 Qr���D1:�^�<�����"C�#L[э��Z�*�v�Q+z��ـ�����%��Ur�҆�86��#�ۼ�u7��33&����Q����.��l5Z�e�2궬<���O��Y��1b���V�mˤ��Ip��c�{�鰶M�v>½+�9��÷20�GC��4 .wU��0��zf��E�3Z8Yx��9��҈�r��;�ni�1�Ԍ]-h���!���i��,���2�O
�ۻ�h��܉���i�6����f�<L:�{�2"Pm(��\�n��rt��.�,d�M��&�f@�k���0�-_�� T:.]�m^�?%U�|��8sY\��q�`�,��t� EU��^��x*�w�;LnBdj���	�;WD��k�m��2ȁ�����go�� '�XW��^h,8"���w��x�,�#��J���p"���+bBN��E�p:z����7uq-j��j]e��֪:,s��ur�,/�X���b��� m��dNW�����5��m;\0��Q�+H�m���մGHu�-G���4�4*)�bx0�H��t(���`�w�(!([�K�T�]��e�#hZ��	�!jo�jmb�����~t�G�]���U�9{��/��
���6#Y�.=�1/j�3Ҭ��<I���ڙ5��}��Y�jY̱v/��%�X��C�R���B�5#�9#�,h9 �_
�9 ��:U�@���ő0_1�P����4C�;� cÃ3�n|�����2��>ë�2Ų�D���!����gH����rw9ؗP��ܦW�z�A?uR�����ǀ䬬ۇ���gb=V��YzV�8ܶ#1ZUs�����޷!�4�<R�1�;8��Nݨ�xp[_'�o;U۠�#��]u�pۆٛbR�%&��&�6:M��996�L��s���Ϻu�S���t0�.�CK{ȶA�4�Z�&����rm�' ֫���Ǿ�����0蟣��]e�Ӱe	�*BK	^u����R5����]$���w�\�:d�j�b]��w�%�o?��<a�`w=��0Ԣx�q�����T#�V��i�{�ȿ*�FM���Q����2&��R3���� ��"��)���txn�g��K���ۻ�.U1OL�ޤ���fn�c�x�F�[W�l'����WG�:�[b\hR�.�DE�S(=��E��
�ġ�=�P�[�A`]UvD:�|}V*��L� �<�r�50��@1?r�ZàǰDZ�B�k��a<��-ǈQ���(�D�v/梊��?����1�]2�UC+WL`�\W�`7�zH8��L
�89 |�Q������Q&X�eh� �޵�W&�;�&��(9�eN���z�l�2��MFW=��n�כ�`?�0�V��J�TQ2����"�&�DH:�i0���z/D\��BL|Q�JpU.��t��z2�i�ǟ��LsY�Q�,�ɿ��<����>�YL��˨~�EW�4��Zz�w���u��I݃-�v.�^I�Y&ǼFr��]BG-��{w:7֞Ÿ����1c��F�3�d���^A���q����mY&�J�[��-����E�Ʈ�8Xّx�V��X��i��&1�]�5���;V�LI���uv̬�Fp- A�aJ3�>*]�q��r$e�RǷ�?���j���w��o���v��Y� ���q�����Y��DA,|u]5���>����%8D�:h�c��,��/@JD1b?T�Wo���=���v�Z�ν;b߾}��\����/vk��Q��qQ`��ȱ�B��ɢzR&X��ꉌ��ǂ��2�hJ���	5u��{�ȅ�9�.;=z�-%W�\�n� ���]�_���휯�f'�k�]�k��4yx~(��ۼe ��Nq�	��XWs#r��ط�FՓ+�B���S+��	tF,��sټuuXX�ż�疛8��-��L�����Ru(�Z�,J��I(�p�TX�\�e�<�h�'���@�0?j���(�%A���4��HA	?�@��T����ɀ�!n�k�S�ݛ�b:	�(�j���sq�,kā�������)k�̢?���LE�;���xH��)�R�ѵ�b�a TE��P��Bo�� �C�!�O4P�x@����S��se�.x����J� �w�)��6���D?xI�\���2�X��x�L�R��p~*�k4��fd��8)�H&Ӻ��-k�jR�w����lR���;L=÷��v�K���n�\���}��nٸ�� .�u|��Xױr�8�,u��RGp]Ę�����c,�����p������֜6����c6ٜ@$ׂD�Â߻*P2�j,Eh�=�+���o���q$h�K����x�YGln�12a�0�����k�.����v�#Z ���&�Z�ѕf�I��e�-���k*��"�F�Z����]��wpnJP��-m2�&.]�i��������@ʎ��+lm���g I<)���z&8:5�5��@{Ϛ2���bG����໨�V&v:�ԏ�;�-z^k��V�Z��oW(��{\���k�u��g�v�D��'J��ڽ�?M�;�	�2�3�ՙUX��{$Gі"e�� rY4������Ő������4��츦��w�lԎ��8.n��n��(���>|������!Z��\,�O$Zs�FR)���s�����E1QVU���S
@�ׂn~�r�Iƚ �/MJD����.�@�D
���ļ|Q2i�|@I0�w��,�x |��λ�N�釪ח�^@��a���Gł�)҉o|�>��x��hY�qn�� ��,�-F�$�'}:��� &%S� ��9�W�e�������r�ݐ7�)�L���μ�)�a|����\�9d�AG'$�b�22.�8q�QU��1����;cv���F��+�ch���ߢa�;����[���.��b�ȳ*j(�����gr]y��v�g��ؕ���ƺ�6����"D���R�;�7!w����<V�϶���&.�i�$r�q���к%(D1Ѐ��r<�z���	=�����,�Y���ß�=���lݶ%#�3���p�>����]�	ß5^v�� �~+��p�Ű�Ɍ�4�Z�<��{~���]������%��lҕ���z��H=kh�{�.X�5�K� �Ti̤nR���bk��|��P>�H�p��2-\�=�ԫ������p/U�g�G%��\�]�m�_:K��{>���(�<�wz]�D�vr�K)Ts#�ҍ���{0�O0�W�ډ��t��V�I]�3 �b�Z�#Zǳ��f�<#!V^m�[��jا��� �R�� �"�ä���.b@E�ŵ�e"^�Ҭ;�-�P�i�($��P"�����
h�$�r=���:�����z�˚�䁈��#(�E&!ďTY��Cu7�)�AǊ ��Ǿ>(��nF�bu�ze�b�-yU�2��<RM��q���f.e0ݳ��_�Xq	�/c��z��f�u>ʬ�jYW��Y�Hj2����M�:%���D3M
�E9�(���B��� ���*����j����r��*T;Y1�zy�
�>����0Z7����ϰ�&� L��
�WKz��J]T2�N��~d'8ƚ�:�v��^��2�rG�����W-���,\{2����]F�+��L^��z�F+�ڷ��%\�飅����`�c��A~
a�ic�{R�M��0w����x��۷v��`zF�f��봫��+Q���5G�ݑ�n�[$�?Ҽu�6� x3��["?1ܻ������i��r��%��5y��3��F��-Wz�vL��j�8ٗF&nA��*Nr�&�Q�ɶ����+5��=��fIzZ�y$��ӣ��>0څ�:;~ف7"[�v��g�v�"�h�������ܐ�*� �(l��y�� �/��3���a�f�R�GʶI&L���������42.�R��޹�m���1���E����<TQM�U�l�+�C+1����E>��u �!��-�q
����� E#8�h�9��(�
���碡7.(%ƴ��9d��1 �g<�;~�t��A@��@�� �(�&$;���ʄG���u��H;Vn�� ��eĺ���j���2lЙ����\�/��j���_�j��p�D3�p|�HQwgֈ�EN�8(�	��*�J�ܖ4QUe�:�x3��gn �x�FkлzK���g��y��C��o��w�~u���t�J�nX�r�H0.%2���ϕ)N�MEڵz�w��y��f�\W+2�۱D�y�Ý�ecQ��+	��ͽ\¿�Tp*��L�;mα�c d	"�V{<�a��?l�ɷ;������鵏0��s3���/��ќ������D�[}�+�,\ث�Y�Pe&$sZ_Fn�o�[><�ڼ�z�0��@u?r���=�i!?�ϣ6��X���Vˈ}+��j,d��"%�}/W�Y٘'GnK�oX���D�q�N���~�X����u]�iO�W-���1Ż}H]gWnB�4iSu˱jّ#�WRTy�pwL�#*9�:Mr�w1���A�]�.�t�W��G��<;v�r�B,�ݿ�c�{�o}K��X@�ɇT���:�R�c���1rb&$�1t�-Kr��=��Q�0����E�dLI��0��Q0�A���Cz���"$*8��� $PI�z����Oj'3�vx cf��&Q�E'�$�ނ$h���z"��D0bP5���P3��fh<����;Q�$C��*4$|}��
��@��D;3�C$KWR� )��ER� T�5��U+l㇪ҷv������Q��l0?]c�κ�j �����6���"b���3�e0�����L���\�c��p�[̱2@.�˂m�����q�Kb*�(�kr[A]'��cxܿ��� iJ{�����x�$8n!Wy٫�]�,[��)�fuX�=;2�v>�#E~�-�f�p�Ծ�t����v��|A��a�W�a�{a�V�p�o�ڵ\b+^T�\����@��*�&ϕZ���5c���D��1{��dA�V�+;'�d��2�4���-L?5ʷ�y�w���+��T>��r4�+��C�[�q��j�k�v�-c��U��W37+va�e�+ϻ��L�1nDy,��������'�?���\�����sn޸�T��Z�I�6.d�E|�Z�t�Wte�J2�vP �b�٨���ϻ��|��K�*]e{?m}w���d�	g%\�;��-��͹B&�D	�
���Qgt��n������'	V'�\��<ߚ?H��Q�6�d�KP"�����z _::qA8܏?�yj�$Ɓ�NhqNZ���K��0w�	�""G��2c�؂2D���A>����]~��DI4(�ȑ��"�?*b���"tz�)���)����*�!9hȱR�T�H�i䲡��P޵���� MȵYn3�Ҷ+M˂��oF�S���?�'+��;:�J�W-��;g��8����2o���gC.���⣔�7�v���E��e�J�1���CT1���J�q-����u
8���0�K?�Q�k��nx���Y��#����J0��t��᾵��7`�F:��?.D#u����]=oge����h��l����WU�|�*
�,6&�%�)/wV��ǟ޷�F�����%�b�^W���9�e��@I�X����V�d$�/r�]u�?�#9��q��M�ؕ�C淪W�v~0�����<��߸����@��W>��{�@�@Ӑ5���G�n��"$�yk��vt�e�ffO&�$��עLWmVZ'GEj�T�zq!���J���2�i2��]>��Y�R�9�H�m��F������L�:�;a��1͏��Z�V/zv��waܣȌdx8��t����2�%j�K�Tc[yv�D��E�(�X��T?@5mP1���f�(�Dې��E�DHx�$玨�9䋔X�2ph�K܆N�i����آM����P;�.z��=~��Z����}G�>h#�U�����A�Mhh���:*	�Ԏ��BQiFi*�N^�AV�QUnW�rR�^�[$	Â��I�AW]#5�^ X�[y���iNV��y���u�X����|I�:h�o�X��m�ܦ�@K:<�GQ~pʶbX��kI.�᷈]7" sU�iV0g��>ŗ=��m���u�Q#�ݰ�)I��Q�՝�9ؘ��`��:]1��H�[y2����o#����F��G;��d�@�W�@mf�����W+b�sa0>-N�&/�:�Z��B2%�����e��I%�T�����	�*1X���~�7�J���ڰa�K��W7GK���wc�u�1^����!9`�WL��%�wmZ6�t֩�k����� �4�E�=�v�����ݿ2Iq�q�Ӡ�?n+64,d4*(��O�*a��(�k�(���hˈg�X$n܃ʈ��7l�4��L+c�2,�2��	�;=������9�`�\Qkʘ���{{��˲c�� �%nY\��X�� �{�"'�,ϔ�
��:������#k"��L9�cf��v��#��-Z�	�<y2��uE7�i�?/��W�)��!�@�2���n�h���y��n�N��R��o�*#թ'�u(|}���D1 cO��%�!���?��                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              x�Xko�6���
�ऋ��ˀ-�^�l�6p�XW�D[�$R%����w�PDIΰ	���/�{�W�oKyK�{q����� g.X~4�u~�������+�>ss4y#I��љ�!4˘ք��ܱ|r��� y~��L���nV�d��f}��'��.�&^2R2�ɽl�bӊ��L�>5LCn$�5���g$��(Y�L�M#2åг�/Hl}_�@�S0�BS"�9�?�\Rg^��2�cL��f�$�(.��AEN8N̤RL�R��gf%�:��)d>#�Ͷ����Z!U�2� S�CBH���0%�\��3���2Y%q̄�3�D�
Um�@�OH��1u�p��=�Qa,8�Y��!q�HFK�)h�l6@��<�E���R��������*��Ѿ*նz��FC���H_[�a$g��R��cj}�$���
8 �9u�ɖ	�h�(�@?+LU:<���ST�Z\/V,^;V/�!y��Z���P Tb�۪X ��}x?��Ӧ4iG�����X	��'�e�� #r�qȮ�Y1b'хl�'��9���#$f'ٞC�*������lk魼c�3��'N�,$�̓v�Оm)�ߜ���h������IM�,���h鸠/Kb���4V#5�-̜�;��K��U+y�Q���tF���BPQ���CpGK����(*4�K�Ӝ�iW��|y��Z�.��@)3�4����62;�~���#qxXI�uH���5~�A+��MjhZcs���t�;�.}�.!�1��IVP���~��s�}j�@�PV%�&�
�=�j5������݋���fqb�]O�K�12_.C>�G�k�Gx����Hu?�O�b��L�8��#<��9;rA �:x��T|l��=LUk9&-�*[�F��@�Y�ڡ�ER�-�����}�9�b[�ѥ�nՊ�v-Zf� p�w�p�W�@�q����Ty�w>��?f/�GV��d�W�bj���v�?'�	b� ��p��s!�}�%CÜ��G:��S�,��m�;Ѣ��0�ۇ�A1t���ҿv��Y�>���|�E�W��� ���{<�	�f����pT�:�>�����
ϕ5�Y2<|T�q�{�	�ո��Zc���z�9����-�qE��]L���it�<��I ;Q�=y��|��!�h��B�^�?�?�����F��G�	�&�C�����JcK���󸹸|'-���
�",#��jC�V��o���om|��o���2�!G��
��Kώ��堆��t�|`�)S#{�̆����\�:������{�0L|lhI�J�N׸i�{X���Һ5Lq��@ޕ<PAN��u~��y�����ųz��ڵ��Z�,<	/��%ޘ{�fc�)�l�X�g���0�ݦ��ad��<�o�X�G�&��s����G@��@��|a���cxm�Iܔ�&>��d?
�tb�Q�^f�����Q�e���y����~�)Ҹ(�q�P��,C�a�}��{r^r�F]�2'�/� �Ҡ�2�O=HC� ��;tO�t�o��ቫ��+�k��i_��d~����}�~�C"pi͓�~��:9:Mu�qk�]���+�$$�ƐӇ���`G͎����?���LH��>>�=��C|i����������������                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ���� Exif  II*            �� Ducky     F  ��http://ns.adobe.com/xap/1.0/ <?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:DocumentID="xmp.did:258ED9BE34E811E5B0FD814EDA39DD7E" xmpMM:InstanceID="xmp.iid:258ED9BD34E811E5B0FD814EDA39DD7E" xmp:CreatorTool="Adobe Photoshop CC 2015 Windows"> <xmpMM:DerivedFrom stRef:instanceID="148CB77FFF3F0281B7E8FB247624CB78" stRef:documentID="148CB77FFF3F0281B7E8FB247624CB78"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>�� Adobe d�   �� � 
				




�� XX �� �           	           	 !1AQa"q���2B��R#��br3��$�C�c%S���s�4D&   !1AQaq��"���2���B�Rr#���$%��   ? ���	�'�_��6��y�j�c�s?Z��� ����L n��AQ$��sA�,ǝg(<��~��O@��ڈD�6?7ZF��u�5�	��!���ڜ	9�\\�)6��S@�5�i�8�Ƅ ������ۉ�ӑ@�� I�Q��$ڀM���I�	���RM���+hA�މC��ύR=M�5P~d�P�&�!��H�@�.O:B��'Z G�N@'��&�n&���mU(NP Ǚ�P���Ӕ�4�r2X󩄂[�]z��n&�,��M!����|h�@�`t&�R�0�I�!7�	?:�d,���4���>4H�S����Ev��mF���O
R=N�4��5��af��Ci��2o��ґ������D��Z���jI���G3H['�4�܀ݡ'�5�X�?Z$p�Bh܍���ƈ��Kqҁ��O֪@<��Jv`	�iAj�s�DZB�8���@Wn����y��H�����EL�ǩӝ1$P�S~��*�m}i�|���!�-�27'��҃]ր���P~T� Qj	JX��Jr;$��ґ���F��N�I�tH%�KeV��Θ�-�@��P%�O-z�M��鎡�)-F����Қ`� ��Z���B����[���@���rJM����"�j.T�(eH�4IP=>t�
ǅ37 oíɎ��H�C���(�ک2r s��P��2u ��X��Hs�d�!cLR�n�0��Pؒ���-�nt-�ac��9a���oJR"�L-z
���
���-��ZԊO@ ��l6�D�$6�ڙ,`i��%-��ҐhV�$a~�H%!��4�m���C	��I��m�iH��H�v�0��Ǖ=���IX�[kRh� �:	30�5�4h-kP��ZE��N6�H��5RZZ�RCԖ�(�b �]4�"�A:q�D�/������oZd@m�ց����"��6�P��tD �>4�	9�etӝuh_�9
���d0���
�j$�!��G
dȈ��Mȭ��!�!�!�s�P!�\XP7�"���9���H�Hv6� ���$V� �B`�-$�aoh����Ak�h�@��K�@��j -�@�{S�[C��M�H{�28�
r=�h��6��H���@�S�bǷ����9Q�(���$u�)�D�[�(�(��Dנ{�^B��m�@�}(��!�:Iz�
Í1��Bi�i��!���Aa�� ���P��P��1Ui��ۗE��� ::���k	6����#�n9n�E9@'� ����D�@�� z
�9��IOQ�H��0�o5-� ���4�)��m'�1Hս4t������D��@���@h<��@�ۅ�҉!z}iȱ�#��L�b�T�P�h��%H��TKC
N�H���A�C�z|�JCl�S��;E���x|�������:`0��@�� m���1�g*$�G��PyP=�נ  ���A)��M&�ni�@��2;Z�����C��A-6+[�:q$�Ɖ4NCa��"�[�D�V	m"��%@m���H= .�Z��F�L�G(��)�RꤋH����)d�騷¥3A�Μ�)P)H�H`xiI�b�8�r6�m͇$KQ��iIP�/�P(8p�Kh�csq�c&�����B@<H,h %���[�@�
�B�-��% �O^TV<)�H/ӝ�H�[o������iҐځ��6A�t�B���{E�JG6�ƒ;:p��q��9i���@�ƀ��o� -� ���( ���� [��oJ J���ؒ%jC ? [GOo�0��E "���! � m��D�h ۝Ge��P p�D��! I7���$WO��z�hlU@W�)�v#R/�J�_�Dq�c	qqå4�v��JD��~T܈�{��a��m�d5S��c���[�Z��p1�+|���hB��P�Q��ו"��~T�r��~T�j:P!�G�ѴЈ��`\F�R��
$����ThH��3ݏӸׅ)Q�8R4n�I&Չ��Z�L^BĊc�� ʙ�Z
� j;m(� "�b u� kjbH{lh����J$���Aj;P �*;Z�Z$PE<��m�B`�m֜���P=�R��V� �2Fґ��"���0;Q!n_�h��Z�s�;k�h����SX�(-D�Z�������b��ʙ������<(c�l�ܨ|�8�EBܑ,4�K� �y�aX��Aq$J��|�;C ��4	|1������)I[";I$�U&c+׍!m��҉@$�:�v�z�IQz�1h6�#���H��]/JM*-��Ҕ����[�16@�iH�o��1�E�i�(q$Q ��������m�$�����) [�zr����JI���AuA���$�i��vA�V�!(|�V ҂3P-��]X��)�6���G
$ 6�ӑ����m��9�� 0(~\(A�Q!��-��D"�H�A�m6�*r(})�8P�H���
kSځ� ��An�	�Km�B��H�6�(�JrC��"��-˕���։.o:r,Co҉�4I8K��D��0<)�f�$XH��h�b׹�S�$I�E���)H�B�Õ0�A:���$7��V�[u�9&	��_
RR���k�*$����Eo��X��hF �`E ���P0�ӕP�i ���NDz}i{H��O
$o`�j8.Y�ۥL P��_
$��҉R�T
$����)VPm4I0=�p�JJR�����"�+��:-��__�9*TaI#��~�rKD��S#�a,�^4�`[O:���� �@�m��xQ"�V��,-@1�� ��r�G*>T&,`V�"�@ �6�&���^4�v9���:S����ƀ����$��o.B����y��2���Bbp�e��K�z��NJr�@�%�E�� �D�匯�)��L���!�<��$�dkk}iX8q�)���i7Ҕ�m,i���Z�I��)H��:�6��(�@Z�z����<E8��jmD�V2��P-��:r�$a��4��k�)���<�ȠaG
$�00�iJE��"�
n:�
G�攄-4���;Q#�	��R=����H��ۗZ [z�@v�����Fu�~�$ �Q�)]/ˁ�E
/�T��:q���AZ&�?

��KRJ����<��� �
 aG5�l����4iȠ6�\�!
yp�A +o�ja����C�QH!�[zQ"���9<(�� ����J�ӯ$����@SKs�D��m�]i�I@m��H�dv���A`T��)"�D|�2X�RH(iIx�r|8Ӓ,��[t�o� ��~40��<�P����@�l���JF�Ȁ���(��D�%��i6	m�4H@�( ���B D�H{~f��R��h��X� }(]|iȚ �:$ ���x�܅��Bg�Q!�Ҝ��oJBm�Q!�OTH�64�X��D� -�I:�h��:�ne@��18B ni���IPz�!�8R��@ޔ �ʐ�n��c�Ƴ�PN���
�m��/֔��-���� 6���h�c���hV� �0%�����@�Zb޺ށ!*q����A��D����� .�#Z$�#)�p�%�-�_��RKNb?}gj�?��R%ct��e�'�9!�0/��H�È׈���[O��hoD�$� p�R���rl-D��˟V� ��RZ�
�{A4�B`�� ((�@�AB*�(�p։��8�$ 6����+��h � �]hmH@�@0�zaz��Hb��L4�0"��@h;_Z
�!&�ܨ
`���Ƃfv�q�#��"����N� m�����@��@�9PV��o΁H�ցWq���I:!��ҘI )��o���������B�
d�)��ӑ�6�"�:�h�-	�Z�{u�%��!�
$ ��� e\�(f�i!69� Μ�!��_�\g:Ylz�NF���ND��@�Zr�~?:�zElt�(&S[�ƙ+q��B�G�@��m�L��:�"������Hޣ�:P8�A+NE
M���������E���!��� �(��zkNB�B����rh��ƃ8krV�AP0����<(�D��zr(�{GΔ�ۭ<H�&0H/ZRj�:�(�$-�>4�0�#����� �?�@�d���Ɣ�G�[ANLŲ��#�BǏ
���Zc�"�Ds�E����(��'^���a��Ɖ:a�DUt�ٵRb+��F�m ��H�"1�:r,Y=�-�u��D�m�92�)PO��;]d6����{|54�2���j��6X^�M�n���a��ځ5!��Hh���N<�LX��nW�����#�(���m��D�	m� �m��N@D^�䆴޴��P"�T�=t�<zS�@&�
�u�[Q&z��ƿ�	�	T�N��
�]t&RŲ����:��U_"�oNI��H��))!�4H�6_���1�׍�k^���D�!���!��Gd�
`[�� ���4H5 �Nt�G�����������l<'V+/@���_��`Q%�xQ$$؈��:d5aN�Ҕ�����JR8[^^
E�熴�'��)4�6騠�Ŷ�#�Ҝ��:����CLV�QΉ+���9�ltC�m9�&�v�\�ɓZ�-��h����Ɖk�Ƥ�FCt��R)h"��"�d�j8(�40��Hia�D����ImI�Eƴ��P!�'�
$iI;\�¦ME�SD�at�#KC�l��Ӱ�u�A�AA��ɨl��D�e����4�Dtƙ	��މ�����O@�oA��;���C��i6����v���Ap�QZ���{A�#M1ۯ
#��*�IC�� *$�!�P�	��#�
(l 6�$ V�j� HǶ���� v� � ;@�aR�)H@���P�@
ƀ����hڀ,/@7����[�N@��
$�����H�"Vܴ4��Ȓ��&�I@�AA�� ��MH�ۅ9��(�1�܌F�O����D� �[�4�)���H�KPKԎ�T�Cۧ�4�����I02�(�h6�/o�=�-�Pؠ6�ʉ���H@�g� F:_N�IJ�=��R��f�H��H���~I02��% ��A�1��Ɖ$[5�҉
 �&�!�E9%��ыm�u�;� leo�0���KiNLҖH-�I�P ��ȕX���FBi�M|)�8a�G�Xj
��J|)ɜ1� Ґu��]��W�4F(6aJGZ&=����-�xӑ@��	H�x�!��"�
M8Szi��S�@��6�#�0��Ɖ�H�V7�jd�]G*r1�&�28r���әAmmmhX��1�� ���kӐ����ʆ�@ڑ(�q�5��m��D�����H���)�@��o�).l��$���~V<�)�U{�
��t����� nu�$��[����@�^��
$ {OQ%jH�8�"�,O+�#��2FJR-�q�ʘ@��ZR8��:Q!�D��~�Hǰ~�R�@H�[E;�
 [u�!�
RR�az�D�Z���@�m��JI��Ҝ����j��jF�/@��^uI��$�>t��T�n��S��-�������T Z�%�Fp�YIn��#���2��NL�X���"h{-Ό� (��i��T�N��E*�m���Xm=(��HΦP� �ʜ�!ۑ�a��H@XP���k�h +a�<hbS�6�{�8�@����my�bP;i{�H���E*9Ӑi  "�&���HA��&z��-D�k���NL����!�MztIj�d�!mm9�6�4ւ@��� D�6�Q"��q��H@��)��k��$p<mD������� ��[��Pj {N��p�u��D�e�Hbŷ��(���9��p
$1�����X����S%@m�9AakR��yQ!�SD�X��anTH@nTH�<([�Z �WRmβ���6Ӑ�[E�kJG ښm�@[�2wZ�~�	�`i�QjR8#b>5RCК�5,����4Ȳ�a5�����uu��6Z� /Ɓ��})�L��n52U��H���$F��nt��([S&jy��p�Amn8� @��@�o�Hei@Xt�@q�NB �������AV`��D�+p�H�[�ʙ6�`q�"��� {/�ӭ	��;)�NEP�h�]E��'@r�%���P +}9P-��(��D�×$P�bi ����� � ^� ?����>t!��P;����m�@�΀�� �� AoL �Cʔ���Z$P=�� S}iH$-�>� aE�H�6iD��q�<T J$P0�>��pJ$  �
rb<�X�V��ƪH�$���- ���!��(�Z����R���&�Kr	B��D���:S�N�0��R�K@��T�H/Άʪh{u��"� �RȔ����
b_OǷÅ9�-H{����	T�#aǟJ$PKn�4�G�9��!�NB�t�B`�E��k�Z$ 6�D�c[��ItR2��D��\�$ͭIl҉.4��D�!��<Cm,G�|�����u)' ��iNF���։��e��:����NIJ-��iIl[E�Q$@�������D�	n��!zz��r< ��5�E ���C��xQ"���
C��H�NBq�BG*@ [�@@Xґ��8�(��Z��F�)�#�-��H�6kD��
R=�H@m�=���z$!�D�� *RP�z>5�gM��QNAV�9)!��p<�UI-�$ t�ް^��+i~TH4���i6�Q!�D�����IҔ�;[Ja F��D��Ҕ��Z���:����� V�*rN��miR�9$�<*F�M11[O�O �n����Ɖ���B (�X@�JBTp�;Q! @F�H@m�	��i�=��(�P�!�S�ԤB��$�$ ���*�`x�%�H)� E ���!�GJ$P����iȣP�~4Hޡ��& (�BjC�4H�6�$H6�oD�!ځ��ڀ��!��u�D��~Hߕ$���D��>� [i�iH�-��!����6�ʉ �z$ 6��B��R8�yQ!<k&�Ԁ��4� 5Y1�ҖC��NE
EH-�
b �Jr<I �)j(�� v�t�E��#�� *$P+r-�E�4�΂�i�D�!��I�{OQ#�7Ӎ9%!ۭ"�Z�d-��/��1 �ʉ�Ҙ��Z� +_�D� ]iȠdۥ"������9��NE�D��$IHm�G�8�$J�oƐ�m��S����JF� ��!��H�-q�9�G:$��<iH��4H�:r�Z��
r=��D��!���iH@m� {z�$ 6NB�Ҕ�@�֔����)*A�NE��)�j$ �æ�:r,X�R��*>�p/LS�@�n20�
;PntH@[�H au҉�f�N�VRw@X��P09�F1��%%(-�Q"��rD~h���?�h�@��ND;t�@`^��zӐ ,i�0><iH@�8}h���P�a�ґ-Gn�Z$p;\؏�d@�$D��V��#�	(M	���-��::��"�+�0��\�NX�PG.4������x��U$��Ґ
×ҀANE�֜� -��B	Z�������p����� 	}(�:f��E���R)���&��
R/NB`��$ \h���(������&� OzRd=��ґ��* -~T m�
$Vܨ��#�)mc�P"�HD [��H�[u��H@X|�Io`���$b-����4�G{M�R��m�L a)e)�xQ#���!'i5����� ���@�A�lU����@��M�H6��T�#���Ɖk�cD�kim)Ƞ-D�!m�$1Z$ {E�D������=��xQ"�AO�JR8 ��m�D��a��ƙ.�=�IJ�-��2K�o���q!@8�$ -ϝ#��u<� [E�Ƞ{yډ���Q"�,(�i�@�o�h`~�V��,%]oj$�WP�D�G�^���e�Q,N�[E�NITM NtI)�ґ� ���ND�+C�S&��-�T��m4H@m��Μ�D���1��m�葴���E��D���)*kQ! �BcD�N\������(��GMiIP�T^��D���H t�p+Z��H�(����! (���˶����P�9#�)��Si@��� �;x^�'����D�j�-�m?
y� ņۛr��8����"��Zm�;t�JBm��9�r�1� ^����@[�9�h����G��D�" �$��0�[��UmS����h��NHU�*@�F�B��D� �Z�ah���+NH��P	I-�~ڙ-�����Q"�۩4Hע@�D� v�)��rKh�
R8��-�@Ҁ+JD�+�"kT�)hKm)/Z��!k�$4 k��9%�s�T�V �p�C#��FBhb�:$<�>T�P'[Q#ņ�K!@��P��$E�)Z�족@�D���xRlp-������g�Q%bt�D�}
�JǅL����!�� �~tIJ�rҢN��Q"��Z$ {n:�!n�UH��� �HA�BPu��@��A!���� Ҕ��� v4H@�(a��j$�X��4�F����RAj���`u�ND0�B���H@XS��ډ�$t�D�υ9�iH$GΜ��l�I�A@���Cۦ��q"�xӒ1SǟJR6�m�E�D���$�/ʔ��ʉ�:Q!�[�! A�8tH�{~�H� 4H�6�!�m�D�;R��`Q!J� 4䖵�IP=�H@n'�$�[oΜ��G�zQ"u (���/JG��D�mNI��։�p�0���4�v� �tHޡ��! �9AjRP�� mJH4��4 m��@�$pq5���F�oD������HQ%$1���=A�P��Z$�|��MԤx�ZrL�JJ�ڌ��hL ���B -�|���4H�d-NIh6�<��-��r(6�S�@D���))���I00�r8���H�6�!�ϝ;Q!�Q��-D�jM���ND��)d8u�!� ��$4;u�K�X� }&��Zr,D<8ґ@��D�Z��jR<B�萀�D� �BD��P8;�E�B�H@Z��J֢E@�Ԃj �@�v5�B &���*�])Ix�m,BԤx�[��$P|(���Z$P���!��*$��R=�� 6�!���vb>� z� QD�"\N��B*r(9Q!�I.��NJ��D�"�tH�� �-4<�H4;i��ȇz$ >4HJ$P�X���NF��9&	���H��Q"��@S�PR���Ǎ�!j$ >4� -�Ӑ�"�ӑc h���)�M2Z�x�#U���2m<��G��`��-}(�JI�,�U����4O��$���-<��$��x
�Ċ$ 8x�"��Q#��AJG�P;�Ɖ-)*��iH@�D���D���D��Ґ��jro�)�~�R8H�{z�$ ,(���Ґ���#��9����ksz�N�$)H�L��!� id��Jr<G�0�`Ӓ"~\E)�
r;� u)#��L�����)%���qND�=8ґ���:�ӒZ��"��CD�Q"��Ɣ��D�*$ ��(���!@�x�!։��!c�#��҉" �$����9P�@� h� x� >H@kD��
@;t�JC%u�<��v��lp�nC�L�Ѐ"��($�X�yҒ�<��h�J��Q%b�I��JR�! )���!���$ `s�G���! ����҉�~&�o*R8 ?
$  �@v�D�Z� _�h��R��m։${���#�n׎����C�����d��H�%�Ei�A+�$�AsA8�u�ӑ40A�!ߧ
$Mr(<萂@�Z$"F)�@�
R��$4;ӑ�;���Ď� :R7Q�NE�Jr(C�"u
rN#�)G�G�\�"H9ӑA!�Ғ�O��#hw�E���!�(��G�)��9��D�
ƌ��XމBŎߏ
R<B�։PԊr(
$ ?�H@�xr�G�h�@����p� (�@�JGV�!�*$X�^'�JG֌�j$1�8��H$p1o�D��
$X�(c�)*�dQ%@|5�I�bܨ���"�`k�$�H��)Í���?���
åx��i�#�������>i��JG�-�P�b0�֪�CC�JAT{���1�Δ��w�"�ߕ(?Zr,In4H�0��RKD�t���� �J�(��7}(�u���Q!։�i�'Q����pJ��M�� lF���(�ґ@��G�_�ND;� 7�0��MHn�	@�4�E~��/z$1�!s�!���$@_��G�Z$P�R���r,Gp~4� Zr�NEw�I��0y�!�
$p��D��$X��D�,/@b0h�<Grh�5 (���%*���P;�"����x��b�s���b�d%P��d84H�/FB�މ �0~���ƌ��Bq�P����!zrx���=v�J� �6�T�>4��n�5��x�E�Ëڀ�ﹷ*�~Tм�)	�j�'��Q!�������Ǖ ���j�P0��lPKv�&'P��{���{�Ț�d=�4d<Cu)Q�񧐡�1�#�a�{�V�0-��x���)H@_�9!�Ɣ��_��b;��9* 7֦D��U"h/FB�B㙣!@�}j[4�C���8�$X�)H����,P�Hb��!�)
✄��Ғ t�G�S,P(���#���H w� ���
 /@�q΀�� =���`��H@n4��R�� � �����!�/��]!���$�����mA-��=��C�~�ݭ~�H1�H �bh��h��@��{���@������	�:0��P&�{����@BܹP�}�{��a�8�@b0� �@�Io�� �}i��w��H��Q#���zR,F�h7kz$P�u<CZ$x�ҙ8��|9R��=��& >�hH 7Q#��D��<(��։A�����G�)�8��NBp�!����@o։p� {�0��)H@�R�@�Q!�JB�=�H�7
r=��$P�H@�B���Q"�n�#��D��JB�S�@oh���w��],��$Ԍ�nt��� 	n�d�P(C�9�C� ��h �G
 {�%��!��ց@���*u05D0˝ ��:@Ǻ��~�� 7�� m ��<i�{�[��=������ ����@-G���@0H}������( �S#�)�=h@$�1{�Ij�P���ƀ�=��@�x�D�P�RA����[��KA����@@�1�@��j� �{�-h��{։w�D�x�B��މ��"���D�u�iH�7Ӑ��JB:$ 7�� {�� }�P=@nh�4�����Rxm�]���a��bCd��NS�տ���o���#�_�y~����h�a�Y�:��"���lk�WNe;ܾ��x�,���� �O����/��\�ۛ�c�9�8�Rޟ���Iw*܀^c�+��m��؞���*Ql{�ZF�(���3D��4�!�p��<E����#�?�HI֓�H�M|(���ץ&KԢ�  z�b	�o4�!����J#�)@HĄQ!�$�SD 	H�%�s�(	W������"�$�SD�=ZPZ�ʈ�@��544)P�SR�bAk� Ǿ��y�DG�R ��@~� o4 ��H�}(�v�P?SN�D��YHa��� �P1%�R�?PR%�)0���R#P,@I����(!��I����z��1%��b��~v�8 �H@�ډ�H@��D� �JC�����
A.�x=����:r���H՝��	6t�RYc���� ��������{z�11�&|��C(AbY��n�d�v�]r��^{�����Gz�7rbs��d�����ܰP[RYE�
디#�jͻ5��;� ��/j����N"2�]�T;����J�wa¸�SwG�괸�?Q	>u�&v�/P򥈲A��"�~�A�_�,C!賂�~T�BG��*��?:1C���K�=�:Q�d1':1��#��-Ζ#��i�2��҂�� �8&�� (��C߯4A�~�*X�A�_�T#��ҁ��ZX�!�Kшd��K�=AF#�bO쥈Շ�}h�2SƖ#�~�����R����J?�,D�	���O;��F ���T�^�&��c�� ��IL~���zÍ,JOA��ҌD�N:р��zÝ�r��K�~��F"�=oX�����vHbaE:��ш�[�F$d?Z�%d?Xu��hb]t����I�A�Qc�E(���J�h��m/�<C���z�4� �҈F$��(��~��(!�Q�z�!����i!� 1�����f`�־���S�����ѯs�/x��g�3�O>Jᜉ��Y��X���0
�t���]��4�n�X?v�O{�kK�=�2H����G���i��c�ۢ��H�
��F^�h/sYrr��^
��b��C�{Dd{!�;goL��c�9Qo;G-�cĂ�q���}�އ�_�� K4������� ��x���G?�̪u�S
)=��^���?��W�6���� �׬����GX��^W�Γ�`�[��̧�.�����'�?V����Oc�sK����oΟX�����lb[
:��d�c��,��z:Ő��u�\~��.��=ZO�y�u�Q�+��)`�`�գ��,I�G����J-�,C$���Ov����a�[��(�yգ.@�oΌ�=N�b,�z���j�%�F�z����8p�	�=C֌C!��4`Vb�5�����`��xш+�յ,��rM����^�և@W���4��W������ZN�W(�u���?W���Y��񥀕��шd_X؇��i`W`z԰+��X[��4`Wf���:�3_ƌ!��4`���f�&�p)] �e,�zÝh~���D�Q׍N�C�h�2�9��=m8рHz�?*0a�Z��`�C�b4�z԰`�<4��Yd(-�����8�Ҿ�KU����d�������{ݾ�����Y�;�w�/'���͒�����UI��5����wK����_'���l���}Ǿ�B���a�rT�+	X�� �.Z:�s֬�&z�gI/p���Y�T��qc�¾�.��zo/R��ڽ���n�{o�cv�<�����3+�v�4=+�=[����?2���K�����s�ף�㻌d��iu��Q��<)u�o�}�Cv �+}~t�'��ܒx���H�xс]�� �4`�c$�t`��@�ZN��C#�,r���4��iu��r|u�.BC$�����E�4u��He�� *O�}��Z���� ��u��S�$2�6��p���OƟXv���A�.��}և_�a�uq�QGXf/�����`�P�}(�%��Z]ev�/�ҟX�@d�{�h|c�$r��Ƨ�$�44u��@����O`}н�
:ƹI}Щ�h��xގ��P}��ϥd���
0+��W�.��C��֎�|�� su��baƖ�\|��;�h�]�����N:������iu��bq֎��A뭸�}�p8��h}��K���18�� z��iu��%�_���]���u��~��,��_]c�\_�b��:��c���O�]���*]e.A��u�`zܸ��<�~�.���ֽ.��@��Z]ev�����=o)u��Ǝ�����S�Whz��}�ꎿ*]c�>'m�����׺g���,�úb.<r�J��bq3\n�߰�ڽ��Z�#˿6YU��~c�4�s���;�?����`˯�EPuky�2�/�����'��Q��q�L�ˍ2A&N$�#zyX�z��Ѐk?jl�=u8���}�/,}��Ʈ��*�ەw���^?n`��GڵJ����n�c�x��&p�N��Xc+��U�݈=C�k^ק�_G�}��yj�r��Id(L��>����`-���<-V�߳Wy@2�~��{��@��Wz����� ��E����5�#��4�ʗP�8��ƟQ������  ��ik�K����~���I!�x^Ժ��A/�=iu�A��o�}��/oK�wf�e�h���ϑ.D��GJAv��E�\�/+T;8~�������^���w���a3�^�v4�YQ�R�$2��Xu �>(�����:_vx���Yʹ�e�񣨞�3�E��u���ݛq�ƫ�;�!��_�.������_�@�gC��7�xok��%s��oΎ�N� ��a"�Q=��x�|A�3K�GP����z:���]iu�>�Ǝ���}h|a��׽.�w�r�3���\�9G��u�l��z:�s������I��?�=h�x}�<�u���9gMh�'��-�:K�v����?�=u��O�>�ۍc\� Q}�q�Ύ��X}ٿ}f}�F�iu��ߑ����u�����v��.�\�zO���voƟP����.�{��/�7�ץ���n:Q�Z�a����:�~���{��)s�f�Z:J|����S��ޑΟH�;%�����J�c��o
]%w�f��})u	s0�GH�������]C�d�i���K���_{§���#���]���P�0�h�K��� ���e!�?���5�?�*]#�>]�lL������e����"1<��car_m�[W�ǧ
��et��u��#��z��/��Qrp�(�ټ̲G�.��l���x����]�3��}����xx9���o��EV���d�k0��2��N&zoi����Pȍ����k[�^g3����{�Męd��G�G<����m��m_[��Uj�������X�|k�>'��>BĢI�H�bB��M�ر�:14��>U�O�w�=��;�Ϲ�tM�p�pdI͑���,_/�Lw�gܬ���x��ŕ��N/N�m'�rU���] �'*%@t�&�V� ��ؚ�x���{7��)�t`q�`3�mx�P]��&.���jV�)/��'���� ������� e��o��� ov���SI��̙�p�K�ʉbv�{��5�r{-[V}O���)>�gn����]�>{.r,�YrKbD~V���YGq]�~�_S���Զ�A��nVD��Y�fO,�}�z����?��Bo�)6��r+�n7z�=��of�K���2����t�W��D��0�7�GPM�{�~�']~����l���韽{� �;3���х�s�c�^�&T��r�Q�$�$S2<�k���J�������SKs�� ][���v�c��Gv��cw<���,yL����U�Y�U���y���� �}δ��c�>��KrWW��N�l��3�F����ȗk ��(����`�o��~��'��� ��]U�s�ν�C�_+����a�`�=c���y"r<j�o�q�󥀟#��Ό�Zܝ(�}��`���^��h}ō�S�]���,�={��<���[�ĥ���z0+��sn:�����Nm{���+��F|��K�f���j0+�~��X�������f?�7��� ��'���v��T�p��u�ʓ��+c����R�}��s��c����р�@NoҖ!��N���O.�K�[�K�X����;X���֌
��cF����k_����p�`_h�A��рv��x^�	�`'?�F\���\Ժ�I�X�/Z�$��׾�b�����b� ��R���?_���рvO��ԝM$�u���K{F29Ɠ�k�~�������`~���q/�"���.�\������z��+��wY�$���KіTI)?+�U��	{� ���o�9�^����ɒ>��2��l�d�ŴSN�@R'��n�^����/qsqW_�� ���Cڛ��v˔��OK�����\膼�I�|ek�����j�*H2�O >�}����u�<�a�y�G��$�����������/<��,[�,��V[�e'�w�>��8=� Is����;�r���&_q��b�7��ț��n#��ѩȝS?������~c�o�F��%Y{�fw�`����ø��)��j�_Í�qs���g���
�K��^���e����v{۲���{;C���$)�g��q�lg�}�z�eC+���>K�_'��ԭh��g��f���ou�_��ʱI��P�����@lJlY��ξ���p��|'���moknv�7���M9�aL5G/�=�k�?ܾ��p�ݗ�d��9U}�H�a;\6����'�ljzo��&���c����Q���EN.7p�Hs%� �Z��K�����|'�u~f���=Z[�����?�����e�(�`��=��K	��~��X�a�bfާ�ok%�@�d�D{��b-^��뷽��� vy�p�#Ʊ��쏢bÉ�{v'h�;nBX��b�n�XvbY��bM}?
���	��V�p�$|���,}˲v�dw3��g�H���x	����Ơ�Bƛ��%����v�]^���>��J�ٜ������9�fo�~gr�ws�U���!+���T�[���F�^ǂב����i3�9���J�|����gm�F� �4�{�b��NCI�U�u�����Z�� �z���q�����>���I�2�s=��3;d��af,�0M�/��$k"��Gm�}�� �|\1m���W����4����_Y�d������y1o7ֆ��`\�"��j�nE"�a�_�D�C��C@�?T� m,A��`m@e�����QL2���s�(� ��Ҝ	\���?Z���{���9s����8� �@����ؓBEL �?X��Ěڈ@\��Ho���n4�CY5�ғEU�$��q��F�r5� �� ���s�h3�����<(h{���`�~|��&]O;�ļ��O�'v/S�t��$��I��h%��ր��!���z��>t��p��@+Hė�m!�u�
v����V��y��an�i����~T����T�2@d<ΔA96!!��
ȟ�xަ
Vb���I/P�4���z����z���!&�0Z���N�$��	OZ Y���0�&�������Yr{5t�_�έc�9����o`�ŷ�㟿ʎ6o㙤���?�R���ݙϔ-y�|�Χ�z�����_��S�v�ۃ�+��Г%1>��ĉ4�="�>���9���s�8n������ �}����q�7E��8`C(ڷ㉯֋r��^����t�� ��eC�<�2?`m�;�r�,$�\L���P� 3	c�r����n\�j��&� ��O~��7���_�xa�w�|lϺ�D�f+�%
�	ub.�}w��.^[��}��g:�,|DA=�ٽ��}�ػ�fo�d��ǼE���1��_dQB^Y���M���N������m�ދU��}���n{2O�X��~�/�{�kx��\la�8m`7��� �O��x�<�{��kO��m���剻�7:�k�W��3j^�^�������#�y�ݻnC`�~�k���}�3�M4�l|�d.�����Vx�{?o��j�֭�s�?�~څ=����������I#��\�l�w�9�m�qҹ+�E��;=���4�~O����L����ď'���.?p��G<AK���*6�<lEt{<��R�;��t�Um���Y#����l�T$���J���Q���Z�$ZY��W���ڷl���G���at����� ����Y��G�Yk޲#�<q�.4+���dI%�_�+���M+�O+�� ��tz5u��������8P��;��Y�wL��tcc���+k�-m+��o�y2�j|�����5���� Y�p�n��1;�A�N��Ú��M��k����@}�� ���՚>[�ܡ�+�cw~�g�-�����P�4	��#(fr�Ye�Ɔ�w�����O����i�\����q����lh;�`3fwX��dTɔ���T;���h/W��<������*�ǫ����~���v���/j��&i�he�̊��*�H��C_KW����9kc���A�.4���ح��Ҿ�3��\)�/$��c�n�E����R���#����� �e�/o��.��0Q����g�Qb =�	�B�v��)�R�F� m�U�����Wjry8b��1�C�Ԓ�nT�� #�)$/� *��֐�tTD��h)�M�l5�%jHhx�5����
�/aa�� 4��֖�7(��M�RܚL��Ʒ����Y2IIי�����Ɛ�%~�)�#}(Q�ߍ��hށ �y�4v�$��A/@�xS	%}:R���Ɓ�� 0O��~$�z�jpL�_L��,N��R���F��ÕV���@�/qҀ_t��� �\|�5��q��J�n��,�} �#�^zR��<�R`H���H4�;���hy4��HVz �CMm��H�UP,�� ^�^�-Ϥ��Gݽ�{g����X�Lͻ�m��d��k��s¹y=�G�^����������y>����{_o�Y��H?��(������Hx�����׉�{��~3�=zp���u���O�� L�yɃ#'��_u�
'X7,p�j���-���+����s��?�������u��ۡwo�d:qLɎ�:���\�տVzf�N~�g�=����w�����LLH!�����w]ޣ���?�kV��|���fw���������eO��32�kbE��:Z��%�ݞ;���|���1�ߙ�9�B����78��Q��}�`����oƭ{~L���x<��?���l��/���r�^H2pd�b�fh	A�]�w��F�֮�'2u𺤴j��� ���Gb���l���w��d�M�v���R/����)��#���?��l?lÃ8�x��8ȑb��l�8�TBKm
4 p���"O?��d��g�#×�U�Ԭ�4),r��m �� ��V�O�sq3�� �/l{3ٹs� L�{�g�ӏڥ�w���nSJ� 3�
��Y�Z�C\��{N[��ޝ���<����u�T��pw^��V[Į��>p1;v�6>>6��+�ͳ2���o�=~5�q�^��9�d����z���9��������旳����[?�\���%��z������Az��K�^M���j�٬^���� ��_r{K�v�����Nّ�;�lƒT�$� ���G��@.�#�Á����p��u�o�ߚ���;Oo�#���;z9P���F�,�ź�t5��쯪��88x��*�������� +7���v�y�� E�9�9�cįo����}�����3��� �W��x�h��&4ͻ����c]��T~���c����m�_kOo��3�+}��k ""�k���d�ŭ׉�`��]�r��ፑ����"��14R��@]�Ů��k�s�VK���o�v�H����_���q�7�}W����r�6G�����V�k&0��k���
�^�.�����V�'鉣�+��@X���ׅ}�$���Tݵ�Vbk�$�&��RP6�"kp���C�=>t�V��&7҉6�趷4Hc�zF�JrBM ���01��kB��6'�9CU���������T�0c�����kkF���zm�iD�#���(�=@�܅��~��zR�x���>��A��׽�d������je�1�E"���lb�~TJmҜ������%*����5�JP:���r�!�C7-JC�-��Q%*2>�^��ӒZr?I��b��s���(x��L9Q!����Cb��_��N�b'��*�Ľ�����ֵ��"��=�iChj�~�-JPb��/kD�����(����c�^Td������x������^td�Ѡ�Td���nlO?E:7�Z�hu�$1�kR�R�۵�iK$>����)�.�y�v��/lN�k��9~�ȓH�<p^�� ,B�]�����tL�'��r���y���l�w�u��&I���d�$�_�	��o�y��u����!���S�Q�������mć�����Ï�,xbUE��������V��s���{�\��.�?P�kwT��6g�=�ۿ��8xZ؝�7s�Ҽ�r�!_9�$���gN7�#���y�I�_Z�iT�����nFͨ!q���-���81�&u?�g����цxUIS�a�?��t�� tۯ�t#��-�|�p�U���ښb��	Y�#��_��(�m��+3�n0�Y�v��lo]�G=�ك����=�<(S��������}�@�U?¦ջ�jΨ����;PcXX(��ֽFF�M����#aUq��Ƹ�5=?�~F� �Orv�o�]���]�i�IN�,�r�����x���~�����Ò��w�/}��~_l�#'�K4�`r!�BH*�K�6`5��Zr){�{v��Jq���?�g���i{'��ۦ��_j��,�P��0z��X]�YѶ��u�곯Ē������ ��|C�����DN��b����}�d-����y��M)+�e_9%� /��N[Ѩzޗ�ݔ���m�d���!����t"���8=�菘�}J�W˿�>拷�O�11�;�׸�.��o�(  ��=[��Ҿ�?q���>��i�z鶿���g������ܱ=˖��l9b�\`�l��4r�(Pp�1�s�+C��䵓���u������������{�nULf�HWӓ׌�X�Ucb7캫\<k鸽�7��ǥ�Z�:�!�����?�d#�ƺ���~�P��x�ڞ�>�c�죽��z��B�����z��B~tw0� ��(yjh�a�=F0�F�;��*?�����K���z�Ã�GsEC��k�>�.���@?��(�b���6��;��* ?-.����e�<h�d���8zq�K���*%Ąp�3ƛ�d��c�_��c�����Ƹ�X-kk�h�et�m|)v�z�.�yS\��)�1u!��6��iv��h��x���ԇ�������c�A���~t�X��?���^�k�z����*;��o���iv1����>7�O�����xG�u�K��qT=(5;��`�RB��)v0�htΎ�����Rt��X�����`�>4v1b��@���(�eaRC\�:�ozO���р[�/����
�lx�u@�WZbE��ƴv2pR3(	eGjY���@;�v2�_�џ�>�v����B�m��cb_o��Z���_o�c����\h:[�1𣱏�B���i�O6F)��t�u"����>Q��q�}�?([���|�=M��ܪ�n�9*��k�y��'��>�i���I%w��!mn@ez�IV�#�=�>NF�t0����~F��wf�F��4Kh�i	 �1�k;3����7u�>������>��$�p�Ջ�����Y����M�^_'�W��*�zI����Z.��f��\>TO����o?�����D���}�F�A�j�@H�Ʃ�ʤ^�#���r���������2���	�V�ҴI�7%s\�d������E�kz���Ⱦ��`Y�s�ЍOJ�UG�.�J�gM�><O^t���6lڥ<��sSq����i����d�� ���J�אukc���2/�<�i6/mk;hiFތ�� ��.?��r��^>��9-	� �s�Z�,�z5���<c��?v�_k{ϵ�w�3�����2C*���jP�kם~-�\3����i�u(��� '����[� R?�}�}��Mǔew>�ߢ�?o��X���#|2(�:���ռ�T�Ubژ���;7M�g���G���*}�{�����Wg�p��̘��-�c��F��!΃�r]H��rB�U���=�������Q{gj����F/� l����鉕������!�w3]{���X� +��Om�����j՟�~5���?�>���g���6r����(V7
@ ����k^7�mj�[�� S�ҩjrVw� B^ԓ�`{���� �jN�q#�ac�)�����h�b�ɮ���^f��O����8�'�}� ��A�Q���Ov���QK�#ȰI
#j��&P����n�\\��|W��G��ZB0W���u�C++�8��w����U���ƴl����/~�����9���
Y"1���TՉu���[�D�CU���$��Gӭ5b�����FBh=5�Ǎ,����4�U$��+/�
$� ����O"�PZ�/Z2%�{|.jdx������1�׶�֔��0��Z�ŉ-�h��r+6�ۑ˕T�o�r�֌���|i��� �N?�FD�� ���GO
$u�au���I�u$�v��i����K"�   �i��$�H ?)��Z���@���w���Ȗ��K�6�t����,��$ T���D=/k\�m�%ֲD�b��xZ��=	�(����iH��$cě�NEeuE��kzY��p��Q",5[[�/@4-��7��x��:$!uѾ<8މƤ�,~74���%�@X�=E��Q�n�V�6�� �mБW0$��q^"�C��G�{�[�>Rl���܂��ڊ$��%���A�Z� JJ�Dʢ��w�g
.v�~�Ry��� _��¹Z��y.��� �7���r,oD/����[���
p.��l RB�j���E�Ȋ6��$�$���\���b��8*M���ghH�㵭��Ǆ�6J_�¸�c�Rw+���o�].*U�t9��Q,n����X���9�S!UFv����n��W&�4��y"d���\���l��m�C����	�� 
�c5������p�J�&�FEf��n��x�Z7'(�n>���@Y�8��GK�.�K��#��Jަ$_o�V��_��F��i_'=�o:(?3� �G�7���A�����}�.�v�<���s=\5d.�)P��n{�J�UO_��������鏺��ޝ��vX儜�Y"_����6Z��W���]_��\\�mu���19yE"4��gn��Z�]3�-����o��D�v�����=4)���Ή �2Hlq�o\��R���q�	�-^Ǭ�����\;|��8{o�����d�!��*Ue�ώV� `Rǩ��`v���*���x�z��h䮓�_Tt{?�-� Q���}����ڢ��*�ْlܜ�h��YU�0H%�s�Z�*�պ�t�����˼?���h� F���R؝�N��]��wN�9��i �dX�q�Â��k���H����oI>��b�Ņ1q��EQ��,B1�J��Q��N�3��ɷ�_z�Ƈx ;�M�jZ�]��cIN�d�g��¶3n@5ο��H�ם0�G��J 	7�T�#ƚq:�~��;�u�cƂ^䋒N���,�p���^
��S���pm���L������xU��U�.�*�h� �`����.>t�%�J۵��#�Z 7:7�>:�C@"Ǡ���@62煍�1��D�K)��/��熗�H��OP1�$����PDKb�,t� ��R�i�R/LOa� 6<�k�(b�P"��۔��"� R�1򛾷� ��3{� ]mf$��'�I��Q� n�q7�2@����I"���\�ׅ��_�L�Rüh��|mqR�YRd���"�#��C�+f$�D��ۂ饍R3�	,�́�8���@&ɫ�\:�MH'mKE' -�� ���
RRD�Q�z����P<��N�sm-��x���E����_Z�7RHm6� 5���X�G2\��v!׃*�G�{�6mZi� �ky@���Ҁ�v�U�u7 �>��&� ҍ�:� [߯T�M�,+"�n�lmkn>�e�#�hcn:\7�S�dq�K��Л�<i0�b�BH*�^;U��9��BCvd�	�ְ�려S��})7m~�H)�q�B��N��$|/\ijt��Ņ�&�i�W~M���1�(�nkI�^p Ěo�x�\��%�ꈱUr[k��Ƥr�����Գ�ΫE���R� c8?��6E�i�B|-Q~6�7�2[?���� ��A:yP(�.<k�t/a��|��kܢ=�-�(:��(I�˲3�q�M$Bh.�ax� I�]+z������ �D�</��t��(������Si����VRA�h~u�f6F,�1����	��d6Y�Z�91zD�|����d���^�Ʈd���]�K���>i�Zڵ0�`�� �Hc���}N��<+XFY4O�l�7�m�ڗ_�K4�#n:!�,��u��ͨ����Bp��daH
I���,X���R�+��g���և��W�<� N}��FOꗳ�D�wH7�'e��0`�d̍���ap�쾋>ſ�rY�fֺNR�G;���9����^�F����cw>��#��`�Ck���l�u%o����<
 �����y_�|�}��,�lw�/u��1����� 1�d>�	�T0�r�ֽx�T�/�����s���9�� ����o��]z�Ƿ�C7n��<���HwE�E}� �f�s�o�q�r�^���6*Kt��� k��Ϫ�����4r�	��n�O��h���9�s5�ˡ���7}퉁*M�q�=윑ƥG�1K��-�/ǎ�v���ƺL������I�Y�m�瞖�M"om$E�X������n��ƀj� l��*V�ZEJ������
'�.oku:q�K`XFK�@6ԁs{�~JBķ�Ӎ2Z��i���l/D�X���lmn��$E���ru]	?p&�$��H����Rb����� ւ�e�]��&�?0h��#9�'i�-�1&ɓg���E�n�(�8ԑg�/b�]<i	و1ah�#����DF�U��`x�7�r�f�2Gx�v�^`o�Њ�_��/���ĀH�ɱ�K]<�-jZ��h����Ry�F�+Ӄ9-�G$��<��՛V�8Ѯ�B�ҁY��`P�bn~W�h�;	�r�nN��\�`&D���������}��ZԠ�o Ćm�prۮ~��2b�w�f:\��);)]�I׈�ަY���*x�� 9���%��+��ӡ-{�EF�L��4����~�!XM"�� puk� u8���6,uK������Ј�dD��p��[X�|v�[KR"a ����� U��a���NgSL�(s��_������@�X]�4���Ɔ�5�ط}��E����既����[7�� �~4�)�vg0���¬͢��ov��?�c6�@&�Y@� �h�f]�	�X�¸2;]M���՚u�H�-~��7g�j����K��Չ9�\[P�_o�Z��n�-|�9=��e�4W%w����e8�G�f�Eˁ H�P����;K2�c���V�2Z�Ӎ��t�S��UY���t�{�кqԹq� %1Q���,�`�][�j�3���bq��m����-�����:�&��ȥ���Hȱ ă��nb�zS6>#��o�|k���t-��׍oܚ0|-ɚ�[B�?����Z1�h��H����|�ڷ0e-6�A���W���Z��b�92����v�.��譎{Sɞ<L�+ � 
��~w�#�N܉W���t8yg%�UPё{�|��Kp֓�&�Ⲵ���/�����۞�ӆQ�<yb;$�mʓ�L���廯u�-����k�&�O�U4p��:�G'�Y1�|�Y ��ܤ�@&���<+G�[#%�^�`���۝��X����������U�S�
�� k�$�4Ywұ��Y��� �7���󴘳��e��"��F�ƁG�P-��]��rkc�&(E�x�-�䤑)0e��-�"��$|k5r�1]�p�]m��Qxh�Jd}�A�"KX�B�~��kӍqq���{~���K0�U���C�νDyw�Ux�k�m���
G��(N:��ն�7'�+@n�ZǕ;)$^ċ�>Rz�Rf��'Tk�� ؕ$��d8�I�ͬNӧ�	hfe_����Z���-�Bͷ@�%�i���I����~�v�PTjnn/�LoA��]ѭ��<�_
�ЧՔ���ӹ_�-Uj�"�� �EI�í��<��On���<�������Ue�;&��U���I�FƤ	K�+#h�ӥ���X8�30�I�?��u�C�6�V95�ƈ)��H�V-���ֿƪ����浹ޑD��s���})�h�
M���4�OA^ąn �#Jd� ��� �co���q�^%X~���.&�ZCe�n�Ӵ�W'�P�d�$JH �ԋיҥ���@����+�A�ĚC)D"f �B��1$��v�TГ�ϧ�ۨ��4�2"%��y@�B�AN���˔���;����F3e�p�p ����C4D��<��Q�A<(/&3���n��N�zZ�#|�	�S@[�����L�Aau�ȝw��Ω��K��j,AW�~hcNKv�h8�Oy�IpN=��.G���,jd���E��� (�O�J��3��"@��n���;ֵ�+�DAv m�7�u:p�~Tٍ[4��%@r����&��N7��&���Y������r��Պ��D�%�5���B*�EnB���W���Nv��u��&L�L�������y���$������P-ț|��U�D�6Ŷ1'�+��X��
4�_$�A�L1�����i;�D�{�
����9_��\���ƨ���/Հ�ΩXPta*�q
x_Z��Z��*�R����?]rݝTAib6�`~�\��(���kY�4rsr�ƍ���d���8�o?������nH9ޔ��m����3[���*�<ۦZ#t��u��>&�U��3Ds0��;y�|�L��
M�a�D_�ekWɵ�dv��a�;�����S�z)ȶ��Ի?��l�Ʒ
�X�j/�KNk�T��7��I��c��\��s��oe%����ۇ}]�d��j��7]y:�/k0�]�ky|˱�[+�]��%8��q�A,6���ܐ�|<k��M�w�Bğ�͖f��� x��d�5��A�6�%=j�n6=�eʓ5S����"���ֳ�q�wq�/mK�@�Q�b�Б��	4f��n7���k��ꪔd��8�`HQ�����M�Ѭy4R$�R]8�hoXr(r��ܨgβ�lL�1^��N�A��Oz��8ܣ��KA[0)�����2p�� *l�+���=�jO�(.�[�����ie$��X�����@eUƇ[��c�@�)lؕ���M���_��V�f�a��.Y��o���zJ`Yэ��>Ss@��qf`��E���3&7�r琰��r�&�fXl$�'�-�ԢA[�rq��HP�7�)�ñ9��}9��� ���F$��ؚKnkm,
���cC�G�2X7�Q	Q�eP�����&��$X��;ce�Mx���6Z� �ȻC.�Xv�qqz��	�E��e�U�d��+r���^����-V[�[ 4��Ɠ*Q$j����A��S�8d�y�z��p5�b��Є�$s�1��p��+}	6���nuA��0Q��ʷ>:i�9Ԛ�j��n���XiRʘ#.De�X6��cGPN�u��C���	c_4�ѳ��~Dщy�J�ɒ;�[�?#�K*|��U��^����;��"�YK�s~��k�����d�Ԅs�wmBG6W
	F�	 �4B�i��YE���ާ�>FL��F��ꗿ��Rm����_��MC�j�[���]�]O ��� ��Q���YɎ7T�x�O��1G?c�8�.�����ܟ��ғB���%79mV��:&K��Ү0�7m
Q.�3:�j�9_%�ʬT� <�<��2�=�I�2������K"�����qY�_ph���s}|)�N2Y�*��ȳ��qE+��t�ܗT�+�"EOJAaa��x�J�S;��(��B��.�ت�E�n������";��ϔm}-\C�,X�6�
8p ��44Lн�8?�u���&�4U�>� ��$��fԢ'��
�ub�j�6'�8T�]��#�� rE�6�t�7h���")��"��7;rK���we.5�����:�v�u���c)D�Ϳ��z��q��I��̅�L��IJ�Fh�D����"�x�ع'�7�D��͈M���c���[�b�ɾ,��]�/�M��ҴD=)��7�e]lw5�ʫ8BU�m�ě�v���l���>���q@t�<+�ڳ�J�y91g�<��rD���I���َ�b	�
���Iw�m�wȟ40Fdy( ��y�66�Z먯xZ��n@ř���b��F�ȝtk��Pp�9�t��-.��I��v4Tgc#	,�z��5�x�x�Xr3��_�vNٍ�g�H��h�~o*^�R|<+N��~n:�6^���F��K����2���<��rh���Ʀ�֯S��N����[�����xl�4a��vi�x�r��1�	ס��L��q����3�8�$���X��om��J_�]<����8rY|+c)��sco
���:�ʾ���IH:)7���Z�U3r4YSI�ȫɤG��^V����7���(U?r�����I}3e_��k2�U;Ƚ�P9uֳ��v�6�rT( �~� ��M�͔� }t�52�s�'�S�T�_�s7�RI�~CDf@�d�{s%B��¥�U0r�l���-ĊDY�&��w��A |M�;AI��Ufq`X�����R�`bX�$��m�!�U#q�;��*j�����nO[�Tق�"�Ie�3�� )4��3D�x�@��������:m ) \�e�妤�Œ�Ef͹��@��NuE����Qɷ���*1��F@Q��ЛM�ؒ8��d�"d�.ݲ%��;��M#7d�����W��|ȱ4l7������f��%��,���H[��7��U	@���˴j�kz�jfnȃK.�"Ĳ|�;o��&�
���L1�	�}X���I[C�=ee;Ы�>�[�O:���w$��a����=BԨ2=W�Lg��m�98 ���6�i�L�7ز/S!_���P�m�4��{ߠ`@� Դ�SE��T���lDU7;�m� 4�<S3�%��=YM��c���_���#z��c��
}G<ʍ��mj�͜�-��c��X���F���.Ym{X��ȃCR4�ܱ�<��%?�E��VpѶUe?e�#+$!T�J�Q~��^�&,k�}�+OlѠ��o��ޯ&`�R�Y>��w�&�� I'��F5��IIK�Ε��13�/���R� '��аڹ�(��á$���Y�n�K&�*������<:8ԣk$��;����;&�ۀ�i<�d3Z5! ��s>"ԇ!���J��σ�L�
<�ӏ:�c�T� E�y��6��6�Hք9�����z��Р��X��ɶ�:p&S#K,fzy������?J��-=
�)��0�A{��?"Lx㉊�5�:�B�[Z������[M#9*v�@R47��Z�����-�1��h�ɲ�Y<���/��u��m:K�5�ۀ��S3�) ZC��r����1�bK������֡�F�\�0�!�%�����UbU��8��7��.I��O�.݆eD���0@o�X^������q�ޗ!&�}q+bQe���H��;,C��#?#.�����'�6�
�t�|R�9��Wpv��YaV$�������b�)^jk��R�ʪr.� >��IA^Hg;7��w�2�OE��3{���S�����ݏR�pՔzs���R�Qj�x���.DB��t�)</R�u�{��L���&��{������v��N�w!�o�\6��W��:6�u��G�t�L�2)�S��F���^dUj!�<��vܹqd��bT�����Q�ױ�udx\�u�31��Բ��N�M���Z��pԓ�֞�EJ�/�C�,���V��C�[^�pn��Z`4Y�9{���)2��%V����*�[k�U�l��#P��o)&��Z��V�0�fY��Y����-@�V֓j��5���4���Ь�H�E��b��ͦtVɢϊ���%^
:\^�Y9�bD���8f�,~v�D�	o�B�����S�1�φ�Ň�}T��̊�k!Fm �Z���]M���ʩ!6V ��x5��F��nӹ�}�C\�M��r �©P��$��>4���Xq�_����4�/r9r���}(ry�Ҍ�:�t'����Q�"�j8[�1b�4S�A���������7�	���]�TQ��;���B�䴓Ԧ�![�p����eM�ܔM[D+9}��<�h�i��*q+���ӫ�/Mn��u��^�OR�`�� "�bU���Q��nu���������Ae���>�g�M^ƅ��.�D�6�� ��j]l��&B��H]$:��A��u���X$�>�W?�*����Ԛ&Fv�(�,��)k�x�#Ju�o)hR�w�NVY�T�[�Ei1����H���E-��)!m�@X����\�j1���́�]Xq�k�X�Qb������s�R���Nȫ{u��O��U����!^8�ŝX򶖪�!ŷ*L,x���zq�;.�OZr�)U-��c#��o����i�I�I�B���+�UP6��օqۀ��
��@�[���/aq���˭��}��t
ދ��
k�����z�֚@A��� �Uؠ��N��4&<2�b� ?�:���m����и�E���D�����Je*��swe�;H���S�^ƕ+�J�<#;�ѓ������\gfģ��v�V!���m���V���5�d�t�K�7��:��N�<N�+7Tl�4�@�7�±uF�̘��.np���P�Z�=���ɸ���SZ�Ñ͘r��$�A��U�<Ef�������><��+,��k�;I���j��ܣi��җs%�}4���8,�Y�L�a�@�W��e�������q��)��Đ�_i7����)@�.�@!t�O�	��פ�nOv�y3���
R8�"�)f����#K-]|v����Vܣ��Zx��ʇ�0` R�L�&�;�όѓ�,d�/��\��t�Ç��"���6\�ˑ#�qsĐ4�o�u+��ru�nf��A���� ���Mi[I�מEs�-�b9 5��V�c�\�.�r21q��#�e�4g����i�ʪRg����I����tzxߍsZ�w��L[���x�W-���F�f��ɉ���� ����Bbk���˖#�������[��c�C�?�5��tU�sdR����O�-�g�]���Id�A�y��cɺ��>t�����K�C>o�_y`���1�Epw+�Z�U����%G�)��+!�[|T��V�CI���m�>V�$�Ų��)$Ǌ�t��@@:i��h�'_��J��%����45&�bH��A ���t��*34�ˉg���鸨��Ψ��E���&�]�5u?��?3ChJ����y2�?��2�>>UJ�O�ϓJ*m�������8�caP٭SE����b���I�1�@�g,���Y����	�:�6j
͉�
m��7m�bMhb�f�+�3�'���GJ#$X�m� ���t�bp�Ć� Vp̛�aU,��|L��^�j&m(��c�;�2�˹��_�¶NNGXes��Br&7�%���aMVI|����I]}OU^;س<�ߦ����g�JI$*Ah	kY5q���R���|O,�l�I��7�kP�U���K(@�K1��d��
�G�T��	+˯���ɹpCm����x�[�����hi��ʈK4F&<��w�!ٍr��df��u-��kUd�'��:��oR��[k�!�z�j]F���^+~e�u'p��)��p��Xd��G����r�V��2^�!a�h����WAJ���.;}�pW�� �[���熆��Ƕ�Z%�b?s���$[��P��l�4���"e��bҟ˽e����9Q�I�agF�F���uuDَE���m�k}j2fʕ�]��� ast ���ִvh�ꭶ4���c�3l�����ԫ���2��B�/� m��?m5dō��*u3IQ�r��F�o�Zh��������H@�<��0�u� ������M��l�~��f�'f]G[��jq����G;&u��v+�̪F���Hҵ�[��xh�{�}�D��d��j���F�]T{� ��U������X�3C+bcɍ%>%I:|*m꧱�>��� �?� ��8CC�W��9ɉ��?mf�'���i� М�?k�ʰ�Ǯ��s���X�~��_�O��μ~���۔���`W�`�{�u�qXڱ��`4<�*�י.�� �7�4����26�Xp��]�(-�#J�余��J%���4c�������k��9W��,�ߖk`n�
���l�Iݹ"����b�J#�ԯ������P�D�d�.�����GUh��� qb�����5�n��F������blm�|kUc�Ю\5&�"�����j襓9/G&v�P6����k�n+C"b��Y[ �]nm�.����p"��l���@Qb-z�rU�4��$�K���2-�{.�� �I�"�m�&#�P�7�D���W�O!Ƌr!׍�},�&^����G~F�������7������h(��3�n�1>]1���X��|����ذ��ZA�"��%O�ׁ�W��ɪ-�gg����$�e(���e��w[���z���Ē�v�d���9n�[�k'Z��2h���^� �+lk�-�+'Dk��3+\��' d.:� �`�f����E���Rԁ�>�T�L�a�mѮ3p~u���Q)��)`x`�Z�BUpH#�ecJ3�{߷�(��b��vLIQ��k�
��z^��C�����_�� ���B��tg@<����-dy5��iN�ܢ[.D9'�� �'^@Y�#E�o���őޞh�� H�� X��֕k��Țz�d/x�ˍ$ʓ�< 6$�U�c��I��腯�;.��W^�~��R�Z��\y��$
ݽ�s�"9�%UGֈ_"��j�)D�]�eѴ,u	��j���\Dd�m���M�Q&�����b,�$��6��^�ˋ ��>U;T[��R�'S#�BIض�M4ɵJ%�$�B����Qo��mV�b�W8�lh �i��_��4jn�[e��%-���!#,�ͤ"�E��� Գc�D,�L��:5F*Z�k�d�q��� X����RhUL�{���,A[ ����Ucb�C�J�Dge�8�r�숚��h�?�t�y����
>>j<Nl�M����I?JP[�����2I#'+��π�hU��8�F&8�U�<� x*Z5V�d$����ft+c�@	=�T�j��������UAk���C��5���,D(OVe$��}ڍu6���ge,]����~��2-_��b<���xՁt)\r���de�>K��%H�qv�L1�:
JƖ�jcv�q��7��
�	׈k��銜-y��M�fuk��8�]F�� �4h�yՐ��������xX(�l�k��$m*�݆��cx��c�+��T ����6���f?ln���ORN��N3�ƶE��8�����"�5䬬�����[��2�y^͋+����w[�GXw�
��c�9�{U����[�U[��E}��ş���Ջ��(��3a�s��������6C�q$[���Yl�E��cz��4k_f��#0`��'S�Z�8ZM����"y�;-b�B���a`��c��
��4�0[xleҲ��(N���4�9Xݞ�|o��W��Ϫ�j|\p���/�u��Ğz�g��z�W/k�2J26��A�,fO�◦��M�n6G��	�@�p

\�QW�bW�M����Һ��ӵ�o�@�u�sZ��g�)� ���3YD���}\X���-K���W�G]Zb�$Fo�<My9��U�a�/bdf�� ���՛�GU8��� 1�}7��!�x���B�ER� ����Y�l�?��#zhu"���*��+A�<y	�?�]\|$Vm4o�5�s��p�GZ�hk$+��{�����f��YFg�P�$,c�� ����ǅs�Ԟ�*)$���#UnM�jӂl�~�l3A��v�ƺ+c���2����ʺ �$t���o����1�G-�����Xs�t���9�k�f�1B��.K%������Yҿ#䳝c�ό� !�,o����u5M�V����U+��	�PJٺ��dҺ�ǝn�s���e�����вOɢy�ҁ�bAN�-��Mj�lN�lp۷wl�\���	��{�wm�mN899�����p��y�1�\m���wM�@�!ƺ��^J*��!Y���
zh����pB��푈�)�o��$��z�gB���z�${�����|�G� ��~�V� K��}���qO��ʎw ���C��ؙ� �V� �gdh�GYLyq��ܼm��1��8WҴ,K�܏�?�&�����K,=�\�ʋsp��� �״X��_���ie��	}nl?i�W3�Ĝ2cJJ��卋-�?��Kl��wq1q2!�l������^����/k'��JR�ǅ�WhN��~�r���aO���k�������G��w����p�;i�ċ"i�6#�MfDyZanM� �t��NϪ.��64�D�OW�<I��>`R�Ќ2O;��%�kGR5�v����zhU\�hk�l�9�/h�O�j�h�ܦ!!��$�SBav��|K[Z{��Z"�)8':6/�u�$�Zc����ɽ28�$�����m��SZ�~M.�-��^�q��v�U*�Ɔs,�[Չ��n�����֐�]���?s��(��JeE,ب�����|)��]���5C���/M�<���5���x���uHl�ʱ�`�e��T-ʛБɉ�y����ů��Z�X�%cQ��m&�;G0���p���zƆt���� �b�;&��q6�z].*��)��z�$:FޒpR�nzko§R�g�q�2r��ҷ�q�         }
            for (var _i = 0, _a = props.cells; _i < _a.length; _i++) {
                var cell = _a[_i];
                parts.push(renderCellHtml(cell.date, props.dateProfile, this.context, cell.htmlAttrs));
            }
            if (!props.cells.length) {
                parts.push('<td class="fc-day ' + this.context.theme.getClass('widgetContent') + '"></td>');
            }
            if (this.context.options.dir === 'rtl') {
                parts.reverse();
            }
            return '<tr>' + parts.join('') + '</tr>';
        };
        return DayBgRow;
    }());
    function renderCellHtml(date, dateProfile, context, otherAttrs) {
        var dateEnv = context.dateEnv, theme = context.theme;
        var isDateValid = core.rangeContainsMarker(dateProfile.activeRange, date); // TODO: called too frequently. cache somehow.
        var classes = core.getDayClasses(date, dateProfile, context);
        classes.unshift('fc-day', theme.getClass('widgetContent'));
        return '<td class="' + classes.join(' ') + '"' +
            (isDateValid ?
                ' data-date="' + dateEnv.formatIso(date, { omitTime: true }) + '"' :
                '') +
            (otherAttrs ?
                ' ' + otherAttrs :
                '') +
            '></td>';
    }

    var DAY_NUM_FORMAT = core.createFormatter({ day: 'numeric' });
    var WEEK_NUM_FORMAT = core.createFormatter({ week: 'numeric' });
    var DayGrid = /** @class */ (function (_super) {
        __extends(DayGrid, _super);
        function DayGrid(el, renderProps) {
            var _this = _super.call(this, el) || this;
            _this.bottomCoordPadding = 0; // hack for extending the hit area for the last row of the coordinate grid
            _this.isCellSizesDirty = false;
            _this.renderProps = renderProps;
            var eventRenderer = _this.eventRenderer = new DayGridEventRenderer(_this);
            var fillRenderer = _this.fillRenderer = new DayGridFillRenderer(_this);
            _this.mirrorRenderer = new DayGridMirrorRenderer(_this);
            var renderCells = _this.renderCells = core.memoizeRendering(_this._renderCells, _this._unrenderCells);
            _this.renderBusinessHours = core.memoizeRendering(fillRenderer.renderSegs.bind(fillRenderer, 'businessHours'), fillRenderer.unrender.bind(fillRenderer, 'businessHours'), [renderCells]);
            _this.renderDateSelection = core.memoizeRendering(fillRenderer.renderSegs.bind(fillRenderer, 'highlight'), fillRenderer.unrender.bind(fillRenderer, 'highlight'), [renderCells]);
            _this.renderBgEvents = core.memoizeRendering(fillRenderer.renderSegs.bind(fillRenderer, 'bgEvent'), fillRenderer.unrender.bind(fillRenderer, 'bgEvent'), [renderCells]);
            _this.renderFgEvents = core.memoizeRendering(eventRenderer.renderSegs.bind(eventRenderer), eventRenderer.unrender.bind(eventRenderer), [renderCells]);
            _this.renderEventSelection = core.memoizeRendering(eventRenderer.selectByInstanceId.bind(eventRenderer), eventRenderer.unselectByInstanceId.bind(eventRenderer), [_this.renderFgEvents]);
            _this.renderEventDrag = core.memoizeRendering(_this._renderEventDrag, _this._unrenderEventDrag, [renderCells]);
            _this.renderEventResize = core.memoizeRendering(_this._renderEventResize, _this._unrenderEventResize, [renderCells]);
            return _this;
        }
        DayGrid.prototype.render = function (props, context) {
            var cells = props.cells;
            this.rowCnt = cells.length;
            this.colCnt = cells[0].length;
            this.renderCells(cells, props.isRigid);
            this.renderBusinessHours(context, props.businessHourSegs);
            this.renderDateSelection(context, props.dateSelectionSegs);
            this.renderBgEvents(context, props.bgEventSegs);
            this.renderFgEvents(context, props.fgEventSegs);
            this.renderEventSelection(props.eventSelection);
            this.renderEventDrag(props.eventDrag);
            this.renderEventResize(props.eventResize);
            if (this.segPopoverTile) {
                this.updateSegPopoverTile();
            }
        };
        DayGrid.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.renderCells.unrender(); // will unrender everything else
        };
        DayGrid.prototype.getCellRange = function (row, col) {
            var start = this.props.cells[row][col].date;
            var end = core.addDays(start, 1);
            return { start: start, end: end };
        };
        DayGrid.prototype.updateSegPopoverTile = function (date, segs) {
            var ownProps = this.props;
            this.segPopoverTile.receiveProps({
                date: date || this.segPopoverTile.props.date,
                fgSegs: segs || this.segPopoverTile.props.fgSegs,
                eventSelection: ownProps.eventSelection,
                eventDragInstances: ownProps.eventDrag ? ownProps.eventDrag.affectedInstances : null,
                eventResizeInstances: ownProps.eventResize ? ownProps.eventResize.affectedInstances : null
            }, this.context);
        };
        /* Date Rendering
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype._renderCells = function (cells, isRigid) {
            var _a = this.context, calendar = _a.calendar, view = _a.view, isRtl = _a.isRtl, dateEnv = _a.dateEnv;
            var _b = this, rowCnt = _b.rowCnt, colCnt = _b.colCnt;
            var html = '';
            var row;
            var col;
            for (row = 0; row < rowCnt; row++) {
                html += this.renderDayRowHtml(row, isRigid);
            }
            this.el.innerHTML = html;
            this.rowEls = core.findElements(this.el, '.fc-row');
            this.cellEls = core.findElements(this.el, '.fc-day, .fc-disabled-day');
            if (isRtl) {
                this.cellEls.reverse();
            }
            this.rowPositions = new core.PositionCache(this.el, this.rowEls, false, true // vertical
            );
            this.colPositions = new core.PositionCache(this.el, this.cellEls.slice(0, colCnt), // only the first row
            true, false // horizontal
            );
            // trigger dayRender with each cell's element
            for (row = 0; row < rowCnt; row++) {
                for (col = 0; col < colCnt; col++) {
                    calendar.publiclyTrigger('dayRender', [
                        {
                            date: dateEnv.toDate(cells[row][col].date),
                            el: this.getCellEl(row, col),
                            view: view
                        }
                    ]);
                }
            }
            this.isCellSizesDirty = true;
        };
        DayGrid.prototype._unrenderCells = function () {
            this.removeSegPopover();
        };
        // Generates the HTML for a single row, which is a div that wraps a table.
        // `row` is the row number.
        DayGrid.prototype.renderDayRowHtml = function (row, isRigid) {
            var theme = this.context.theme;
            var classes = ['fc-row', 'fc-week', theme.getClass('dayRow')];
            if (isRigid) {
                classes.push('fc-rigid');
            }
            var bgRow = new DayBgRow(this.context);
            return '' +
                '<div class="' + classes.join(' ') + '">' +
                '<div class="fc-bg">' +
                '<table class="' + theme.getClass('tableGrid') + '">' +
                bgRow.renderHtml({
                    cells: this.props.cells[row],
                    dateProfile: this.props.dateProfile,
                    renderIntroHtml: this.renderProps.renderBgIntroHtml
                }) +
                '</table>' +
                '</div>' +
                '<div class="fc-content-skeleton">' +
                '<table>' +
                (this.getIsNumbersVisible() ?
                    '<thead>' +
                        this.renderNumberTrHtml(row) +
                        '</thead>' :
                    '') +
                '</table>' +
                '</div>' +
                '</div>';
        };
        DayGrid.prototype.getIsNumbersVisible = function () {
            return this.getIsDayNumbersVisible() ||
                this.renderProps.cellWeekNumbersVisible ||
                this.renderProps.colWeekNumbersVisible;
        };
        DayGrid.prototype.getIsDayNumbersVisible = function () {
            return this.rowCnt > 1;
        };
        /* Grid Number Rendering
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype.renderNumberTrHtml = function (row) {
            var isRtl = this.context.isRtl;
            var intro = this.renderProps.renderNumberIntroHtml(row, this);
            return '' +
                '<tr>' +
                (isRtl ? '' : intro) +
                this.renderNumberCellsHtml(row) +
                (isRtl ? intro : '') +
                '</tr>';
        };
        DayGrid.prototype.renderNumberCellsHtml = function (row) {
            var htmls = [];
            var col;
            var date;
            for (col = 0; col < this.colCnt; col++) {
                date = this.props.cells[row][col].date;
                htmls.push(this.renderNumberCellHtml(date));
            }
            if (this.context.isRtl) {
                htmls.reverse();
            }
            return htmls.join('');
        };
        // Generates the HTML for the <td>s of the "number" row in the DayGrid's content skeleton.
        // The number row will only exist if either day numbers or week numbers are turned on.
        DayGrid.prototype.renderNumberCellHtml = function (date) {
            var _a = this.context, dateEnv = _a.dateEnv, options = _a.options;
            var html = '';
            var isDateValid = core.rangeContainsMarker(this.props.dateProfile.activeRange, date); // TODO: called too frequently. cache somehow.
            var isDayNumberVisible = this.getIsDayNumbersVisible() && isDateValid;
            var classes;
            var weekCalcFirstDow;
            if (!isDayNumberVisible && !this.renderProps.cellWeekNumbersVisible) {
                // no numbers in day cell (week number must be along the side)
                return '<td></td>'; //  will create an empty space above events :(
            }
            classes = core.getDayClasses(date, this.props.dateProfile, this.context);
            classes.unshift('fc-day-top');
            if (this.renderProps.cellWeekNumbersVisible) {
                weekCalcFirstDow = dateEnv.weekDow;
            }
            html += '<td class="' + classes.join(' ') + '"' +
                (isDateValid ?
                    ' data-date="' + dateEnv.formatIso(date, { omitTime: true }) + '"' :
                    '') +
                '>';
            if (this.renderProps.cellWeekNumbersVisible && (date.getUTCDay() === weekCalcFirstDow)) {
                html += core.buildGotoAnchorHtml(options, dateEnv, { date: date, type: 'week' }, { 'class': 'fc-week-number' }, dateEnv.format(date, WEEK_NUM_FORMAT) // inner HTML
                );
            }
            if (isDayNumberVisible) {
                html += core.buildGotoAnchorHtml(options, dateEnv, date, { 'class': 'fc-day-number' }, dateEnv.format(date, DAY_NUM_FORMAT) // inner HTML
                );
            }
            html += '</td>';
            return html;
        };
        /* Sizing
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype.updateSize = function (isResize) {
            var calendar = this.context.calendar;
            var _a = this, fillRenderer = _a.fillRenderer, eventRenderer = _a.eventRenderer, mirrorRenderer = _a.mirrorRenderer;
            if (isResize ||
                this.isCellSizesDirty ||
                calendar.isEventsUpdated // hack
            ) {
                this.buildPositionCaches();
                this.isCellSizesDirty = false;
            }
            fillRenderer.computeSizes(isResize);
            eventRenderer.computeSizes(isResize);
            mirrorRenderer.computeSizes(isResize);
            fillRenderer.assignSizes(isResize);
            eventRenderer.assignSizes(isResize);
            mirrorRenderer.assignSizes(isResize);
        };
        DayGrid.prototype.buildPositionCaches = function () {
            this.buildColPositions();
            this.buildRowPositions();
        };
        DayGrid.prototype.buildColPositions = function () {
            this.colPositions.build();
        };
        DayGrid.prototype.buildRowPositions = function () {
            this.rowPositions.build();
            this.rowPositions.bottoms[this.rowCnt - 1] += this.bottomCoordPadding; // hack
        };
        /* Hit System
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype.positionToHit = function (leftPosition, topPosition) {
            var _a = this, colPositions = _a.colPositions, rowPositions = _a.rowPositions;
            var col = colPositions.leftToIndex(leftPosition);
            var row = rowPositions.topToIndex(topPosition);
            if (row != null && col != null) {
                return {
                    row: row,
                    col: col,
                    dateSpan: {
                        range: this.getCellRange(row, col),
                        allDay: true
                    },
                    dayEl: this.getCellEl(row, col),
                    relativeRect: {
                        left: colPositions.lefts[col],
                        right: colPositions.rights[col],
                        top: rowPositions.tops[row],
                        bottom: rowPositions.bottoms[row]
                    }
                };
            }
        };
        /* Cell System
        ------------------------------------------------------------------------------------------------------------------*/
        // FYI: the first column is the leftmost column, regardless of date
        DayGrid.prototype.getCellEl = function (row, col) {
            return this.cellEls[row * this.colCnt + col];
        };
        /* Event Drag Visualization
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype._renderEventDrag = function (state) {
            if (state) {
                this.eventRenderer.hideByHash(state.affectedInstances);
                this.fillRenderer.renderSegs('highlight', this.context, state.segs);
            }
        };
        DayGrid.prototype._unrenderEventDrag = function (state) {
            if (state) {
                this.eventRenderer.showByHash(state.affectedInstances);
                this.fillRenderer.unrender('highlight', this.context);
            }
        };
        /* Event Resize Visualization
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype._renderEventResize = function (state) {
            if (state) {
                this.eventRenderer.hideByHash(state.affectedInstances);
                this.fillRenderer.renderSegs('highlight', this.context, state.segs);
                this.mirrorRenderer.renderSegs(this.context, state.segs, { isResizing: true, sourceSeg: state.sourceSeg });
            }
        };
        DayGrid.prototype._unrenderEventResize = function (state) {
            if (state) {
                this.eventRenderer.showByHash(state.affectedInstances);
                this.fillRenderer.unrender('highlight', this.context);
                this.mirrorRenderer.unrender(this.context, state.segs, { isResizing: true, sourceSeg: state.sourceSeg });
            }
        };
        /* More+ Link Popover
        ------------------------------------------------------------------------------------------------------------------*/
        DayGrid.prototype.removeSegPopover = function () {
            if (this.segPopover) {
                this.segPopover.hide(); // in handler, will call segPopover's removeElement
            }
        };
        // Limits the number of "levels" (vertically stacking layers of events) for each row of the grid.
        // `levelLimit` can be false (don't limit), a number, or true (should be computed).
        DayGrid.prototype.limitRows = function (levelLimit) {
            var rowStructs = this.eventRenderer.rowStructs || [];
            var row; // row #
            var rowLevelLimit;
            for (row = 0; row < rowStructs.length; row++) {
                this.unlimitRow(row);
                if (!levelLimit) {
                    rowLevelLimit = false;
                }
                else if (typeof levelLimit === 'number') {
                    rowLevelLimit = levelLimit;
                }
                else {
                    rowLevelLimit = this.computeRowLevelLimit(row);
                }
                if (rowLevelLimit !== false) {
                    this.limitRow(row, rowLevelLimit);
                }
            }
        };
        // Computes the number of levels a row will accomodate without going outside its bounds.
        // Assumes the row is "rigid" (maintains a constant height regardless of what is inside).
        // `row` is the row number.
        DayGrid.prototype.computeRowLevelLimit = function (row) {
            var rowEl = this.rowEls[row]; // the containing "fake" row div
            var rowBottom = rowEl.getBoundingClientRect().bottom; // relative to viewport!
            var trEls = core.findChildren(this.eventRenderer.rowStructs[row].tbodyEl);
            var i;
            var trEl;
            // Reveal one level <tr> at a time and stop when we find one out of bounds
            for (i = 0; i < trEls.length; i++) {
                trEl = trEls[i];
                trEl.classList.remove('fc-limited'); // reset to original state (reveal)
                if (trEl.getBoundingClientRect().bottom > rowBottom) {
                    return i;
                }
            }
            return false; // should not limit at all
        };
        // Limits the given grid row to the maximum number of levels and injects "more" links if necessary.
        // `row` is the row number.
        // `levelLimit` is a number for the maximum (inclusive) number of levels allowed.
        DayGrid.prototype.limitRow = function (row, levelLimit) {
            var _this = this;
            var colCnt = this.colCnt;
            var isRtl = this.context.isRtl;
            var rowStruct = this.eventRenderer.rowStructs[row];
            var moreNodes = []; // array of "more" <a> links and <td> DOM nodes
            var col = 0; // col #, left-to-right (not chronologically)
            var levelSegs; // array of segment objects in the last allowable level, ordered left-to-right
            var cellMatrix; // a matrix (by level, then column) of all <td> elements in the row
            var limitedNodes; // array of temporarily hidden level <tr> and segment <td> DOM nodes
            var i;
            var seg;
            var segsBelow; // array of segment objects below `seg` in the current `col`
            var totalSegsBelow; // total number of segments below `seg` in any of the columns `seg` occupies
            var colSegsBelow; // array of segment arrays, below seg, one for each column (offset from segs's first column)
            var td;
            var rowSpan;
            var segMoreNodes; // array of "more" <td> cells that will stand-in for the current seg's cell
            var j;
            var moreTd;
            var moreWrap;
            var moreLink;
            // Iterates through empty level cells and places "more" links inside if need be
            var emptyCellsUntil = function (endCol) {
                while (col < endCol) {
                    segsBelow = _this.getCellSegs(row, col, levelLimit);
                    if (segsBelow.length) {
                        td = cellMatrix[levelLimit - 1][col];
                        moreLink = _this.renderMoreLink(row, col, segsBelow);
                        moreWrap = core.createElement('div', null, moreLink);
                        td.appendChild(moreWrap);
                        moreNodes.push(moreWrap);
                    }
                    col++;
                }
            };
            if (levelLimit && levelLimit < rowStruct.segLevels.length) { // is it actually over the limit?
                levelSegs = rowStruct.segLevels[levelLimit - 1];
                cellMatrix = rowStruct.cellMatrix;
                limitedNodes = core.findChildren(rowStruct.tbodyEl).slice(levelLimit); // get level <tr> elements past the limit
                limitedNodes.forEach(function (node) {
                    node.classList.add('fc-limited'); // hide elements and get a simple DOM-nodes array
                });
                // iterate though segments in the last allowable level
                for (i = 0; i < levelSegs.length; i++) {
                    seg = levelSegs[i];
                    var leftCol = isRtl ? (colCnt - 1 - seg.lastCol) : seg.firstCol;
                    var rightCol = isRtl ? (colCnt - 1 - seg.firstCol) : seg.lastCol;
                    emptyCellsUntil(leftCol); // process empty cells before the segment
                    // determine *all* segments below `seg` that occupy the same columns
                    colSegsBelow = [];
                    totalSegsBelow = 0;
                    while (col <= rightCol) {
                        segsBelow = this.getCellSegs(row, col, levelLimit);
                        colSegsBelow.push(segsBelow);
                        totalSegsBelow += segsBelow.length;
                        col++;
                    }
                    if (totalSegsBelow) { // do we need to replace this segment with one or many "more" links?
                        td = cellMatrix[levelLimit - 1][leftCol]; // the segment's parent cell
                        rowSpan = td.rowSpan || 1;
                        segMoreNodes = [];
                        // make a replacement <td> for each column the segment occupies. will be one for each colspan
                        for (j = 0; j < colSegsBelow.length; j++) {
                            moreTd = core.createElement('td', { className: 'fc-more-cell', rowSpan: rowSpan });
                            segsBelow = colSegsBelow[j];
                            moreLink = this.renderMoreLink(row, leftCol + j, [seg].concat(segsBelow) // count seg as hidden too
                            );
                            moreWrap = core.createElement('div', null, moreLink);
                            moreTd.appendChild(moreWrap);
                            segMoreNodes.push(moreTd);
                            moreNodes.push(moreTd);
                        }
                        td.classList.add('fc-limited');
                        core.insertAfterElement(td, segMoreNodes);
                        limitedNodes.push(td);
                    }
                }
                emptyCellsUntil(this.colCnt); // finish off the level
                rowStruct.moreEls = moreNodes; // for easy undoing later
                rowStruct.limitedEls = limitedNodes; // for easy undoing later
            }
        };
        // Reveals all levels and removes all "more"-related elements for a grid's row.
        // `row` is a row number.
        DayGrid.prototype.unlimitRow = function (row) {
            var rowStruct = this.eventRenderer.rowStructs[row];
            if (rowStruct.moreEls) {
                rowStruct.moreEls.forEach(core.removeElement);
                rowStruct.moreEls = null;
            }
            if (rowStruct.limitedEls) {
                rowStruct.limitedEls.forEach(function (limitedEl) {
                    limitedEl.classList.remove('fc-limited');
                });
                rowStruct.limitedEls = null;
            }
        };
        // Renders an <a> element that represents hidden event element for a cell.
        // Responsible for attaching click handler as well.
        DayGrid.prototype.renderMoreLink = function (row, col, hiddenSegs) {
            var _this = this;
            var _a = this.context, calendar = _a.calendar, view = _a.view, dateEnv = _a.dateEnv, options = _a.options, isRtl = _a.isRtl;
            var a = core.createElement('a', { className: 'fc-more' });
            a.innerText = this.getMoreLinkText(hiddenSegs.length);
            a.addEventListener('click', function (ev) {
                var clickOption = options.eventLimitClick;
                var _col = isRtl ? _this.colCnt - col - 1 : col; // HACK: props.cells has different dir system?
                var date = _this.props.cells[row][_col].date;
                var moreEl = ev.currentTarget;
                var dayEl = _this.getCellEl(row, col);
                var allSegs = _this.getCellSegs(row, col);
                // rescope the segments to be within the cell's date
                var reslicedAllSegs = _this.resliceDaySegs(allSegs, date);
                var reslicedHiddenSegs = _this.resliceDaySegs(hiddenSegs, date);
                if (typeof clickOption === 'function') {
                    // the returned value can be an atomic option
                    clickOption = calendar.publiclyTrigger('eventLimitClick', [
                        {
                            date: dateEnv.toDate(date),
                            allDay: true,
                            dayEl: dayEl,
                            moreEl: moreEl,
                            segs: reslicedAllSegs,
                            hiddenSegs: reslicedHiddenSegs,
                            jsEvent: ev,
                            view: view
                        }
                    ]);
                }
                if (clickOption === 'popover') {
                    _this.showSegPopover(row, col, moreEl, reslicedAllSegs);
                }
                else if (typeof clickOption === 'string') { // a view name
                    calendar.zoomTo(date, clickOption);
                }
            });
            return a;
        };
        // Reveals the popover that displays all events within a cell
        DayGrid.prototype.showSegPopover = function (row, col, moreLink, segs) {
            var _this = this;
            var _a = this.context, calendar = _a.calendar, view = _a.view, theme = _a.theme, isRtl = _a.isRtl;
            var _col = isRtl ? this.colCnt - col - 1 : col; // HACK: props.cells has different dir system?
            var moreWrap = moreLink.parentNode; // the <div> wrapper around the <a>
            var topEl; // the element we want to match the top coordinate of
            var options;
            if (this.rowCnt === 1) {
                topEl = view.el; // will cause the popover to cover any sort of header
            }
            else {
                topEl = this.rowEls[row]; // will align with top of row
            }
            options = {
                className: 'fc-more-popover ' + theme.getClass('popover'),
                parentEl: view.el,
                top: core.computeRect(topEl).top,
                autoHide: true,
                content: function (el) {
                    _this.segPopoverTile = new DayTile(el);
                    _this.updateSegPopoverTile(_this.props.cells[row][_col].date, segs);
                },
                hide: function () {
                    _this.segPopoverTile.destroy();
                    _this.segPopoverTile = null;
                    _this.segPopover.destroy();
                    _this.segPopover = null;
                }
            };
            // Determine horizontal coordinate.
            // We use the moreWrap instead of the <td> to avoid border confusion.
            if (isRtl) {
                options.right = core.computeRect(moreWrap).right + 1; // +1 to be over cell border
            }
            else {
                options.left = core.computeRect(moreWrap).left - 1; // -1 to be over cell border
            }
            this.segPopover = new Popover(options);
            this.segPopover.show();
            calendar.releaseAfterSizingTriggers(); // hack for eventPositioned
        };
        // Given the events within an array of segment objects, reslice them to be in a single day
        DayGrid.prototype.resliceDaySegs = function (segs, dayDate) {
            var dayStart = dayDate;
            var dayEnd = core.addDays(dayStart, 1);
            var dayRange = { start: dayStart, end: dayEnd };
            var newSegs = [];
            for (var _i = 0, segs_1 = segs; _i < segs_1.length; _i++) {
                var seg = segs_1[_i];
                var eventRange = seg.eventRange;
                var origRange = eventRange.range;
                var slicedRange = core.intersectRanges(origRange, dayRange);
                if (slicedRange) {
                    newSegs.push(__assign({}, seg, { eventRange: {
                            def: eventRange.def,
                            ui: __assign({}, eventRange.ui, { durationEditable: false }),
                            instance: eventRange.instance,
                            range: slicedRange
                        }, isStart: seg.isStart && slicedRange.start.valueOf() === origRange.start.valueOf(), isEnd: seg.isEnd && slicedRange.end.valueOf() === origRange.end.valueOf() }));
                }
            }
            return newSegs;
        };
        // Generates the text that should be inside a "more" link, given the number of events it represents
        DayGrid.prototype.getMoreLinkText = function (num) {
            var opt = this.context.options.eventLimitText;
            if (typeof opt === 'function') {
                return opt(num);
            }
            else {
                return '+' + num + ' ' + opt;
            }
        };
        // Returns segments within a given cell.
        // If `startLevel` is specified, returns only events including and below that level. Otherwise returns all segs.
        DayGrid.prototype.getCellSegs = function (row, col, startLevel) {
            var segMatrix = this.eventRenderer.rowStructs[row].segMatrix;
            var level = startLevel || 0;
            var segs = [];
            var seg;
            while (level < segMatrix.length) {
                seg = segMatrix[level][col];
                if (seg) {
                    segs.push(seg);
                }
                level++;
            }
            return segs;
        };
        return DayGrid;
    }(core.DateComponent));

    var WEEK_NUM_FORMAT$1 = core.createFormatter({ week: 'numeric' });
    /* An abstract class for the daygrid views, as well as month view. Renders one or more rows of day cells.
    ----------------------------------------------------------------------------------------------------------------------*/
    // It is a manager for a DayGrid subcomponent, which does most of the heavy lifting.
    // It is responsible for managing width/height.
    var AbstractDayGridView = /** @class */ (function (_super) {
        __extends(AbstractDayGridView, _super);
        function AbstractDayGridView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.processOptions = core.memoize(_this._processOptions);
            _this.renderSkeleton = core.memoizeRendering(_this._renderSkeleton, _this._unrenderSkeleton);
            /* Header Rendering
            ------------------------------------------------------------------------------------------------------------------*/
            // Generates the HTML that will go before the day-of week header cells
            _this.renderHeadIntroHtml = function () {
                var _a = _this.context, theme = _a.theme, options = _a.options;
                if (_this.colWeekNumbersVisible) {
                    return '' +
                        '<th class="fc-week-number ' + theme.getClass('widgetHeader') + '" ' + _this.weekNumberStyleAttr() + '>' +
                        '<span>' + // needed for matchCellWidths
                        core.htmlEscape(options.weekLabel) +
                        '</span>' +
                        '</th>';
                }
                return '';
            };
            /* Day Grid Rendering
            ------------------------------------------------------------------------------------------------------------------*/
            // Generates the HTML that will go before content-skeleton cells that display the day/week numbers
            _this.renderDayGridNumberIntroHtml = function (row, dayGrid) {
                var _a = _this.context, options = _a.options, dateEnv = _a.dateEnv;
                var weekStart = dayGrid.props.cells[row][0].date;
                if (_this.colWeekNumbersVisible) {
                    return '' +
                        '<td class="fc-week-number" ' + _this.weekNumberStyleAttr() + '>' +
                        core.buildGotoAnchorHtml(// aside from link, important for matchCellWidths
                        options, dateEnv, { date: weekStart, type: 'week', forceOff: dayGrid.colCnt === 1 }, dateEnv.format(weekStart, WEEK_NUM_FORMAT$1) // inner HTML
                        ) +
                        '</td>';
                }
                return '';
            };
            // Generates the HTML that goes before the day bg cells for each day-row
            _this.renderDayGridBgIntroHtml = function () {
                var theme = _this.context.theme;
                if (_this.colWeekNumbersVisible) {
                    return '<td class="fc-week-number ' + theme.getClass('widgetContent') + '" ' + _this.weekNumberStyleAttr() + '></td>';
                }
                return '';
            };
            // Generates the HTML that goes before every other type of row generated by DayGrid.
            // Affects mirror-skeleton and highlight-skeleton rows.
            _this.renderDayGridIntroHtml = function () {
                if (_this.colWeekNumbersVisible) {
                    return '<td class="fc-week-number" ' + _this.weekNumberStyleAttr() + '></td>';
                }
                return '';
            };
            return _this;
        }
        AbstractDayGridView.prototype._processOptions = function (options) {
            if (options.weekNumbers) {
                if (options.weekNumbersWithinDays) {
                    this.cellWeekNumbersVisible = true;
                    this.colWeekNumbersVisible = false;
                }
                else {
                    this.cellWeekNumbersVisible = false;
                    this.colWeekNumbersVisible = true;
                }
            }
            else {
                this.colWeekNumbersVisible = false;
                this.cellWeekNumbersVisible = false;
            }
        };
        AbstractDayGridView.prototype.render = function (props, context) {
            _super.prototype.render.call(this, props, context);
            this.processOptions(context.options);
            this.renderSkeleton(context);
        };
        AbstractDayGridView.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.renderSkeleton.unrender();
        };
        AbstractDayGridView.prototype._renderSkeleton = function (context) {
            this.el.classList.add('fc-dayGrid-view');
            this.el.innerHTML = this.renderSkeletonHtml();
            this.scroller = new core.ScrollComponent('hidden', // overflow x
            'auto' // overflow y
            );
            var dayGridContainerEl = this.scroller.el;
            this.el.querySelector('.fc-body > tr > td').appendChild(dayGridContainerEl);
            dayGridContainerEl.classList.add('fc-day-grid-container');
            var dayGridEl = core.createElement('div', { className: 'fc-day-grid' });
            dayGridContainerEl.appendChild(dayGridEl);
            this.dayGrid = new DayGrid(dayGridEl, {
                renderNumberIntroHtml: this.renderDayGridNumberIntroHtml,
                renderBgIntroHtml: this.renderDayGridBgIntroHtml,
                renderIntroHtml: this.renderDayGridIntroHtml,
                colWeekNumbersVisible: this.colWeekNumbersVisible,
                cellWeekNumbersVisible: this.cellWeekNumbersVisible
            });
        };
        AbstractDayGridView.prototype._unrenderSkeleton = function () {
            this.el.classList.remove('fc-dayGrid-view');
            this.dayGrid.destroy();
            this.scroller.destroy();
        };
        // Builds the HTML skeleton for the view.
        // The day-grid component will render inside of a container defined by this HTML.
        AbstractDayGridView.prototype.renderSkeletonHtml = function () {
            var _a = this.context, theme = _a.theme, options = _a.options;
            return '' +
                '<table class="' + theme.getClass('tableGrid') + '">' +
                (options.columnHeader ?
                    '<thead class="fc-head">' +
                        '<tr>' +
                        '<td class="fc-head-container ' + theme.getClass('widgetHeader') + '">&nbsp;</td>' +
                        '</tr>' +
                        '</thead>' :
                    '') +
                '<tbody class="fc-body">' +
                '<tr>' +
                '<td class="' + theme.getClass('widgetContent') + '"></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';
        };
        // Generates an HTML attribute string for setting the width of the week number column, if it is known
        AbstractDayGridView.prototype.weekNumberStyleAttr = function () {
            if (this.weekNumberWidth != null) {
                return 'style="width:' + this.weekNumberWidth + 'px"';
            }
            return '';
        };
        // Determines whether each row should have a constant height
        AbstractDayGridView.prototype.hasRigidRows = function () {
            var eventLimit = this.context.options.eventLimit;
            return eventLimit && typeof eventLimit !== 'number';
        };
        /* Dimensions
        ------------------------------------------------------------------------------------------------------------------*/
        AbstractDayGridView.prototype.updateSize = function (isResize, viewHeight, isAuto) {
            _super.prototype.updateSize.call(this, isResize, viewHeight, isAuto); // will call updateBaseSize. important that executes first
            this.dayGrid.updateSize(isResize);
        };
        // Refreshes the horizontal dimensions of the view
        AbstractDayGridView.prototype.updateBaseSize = function (isResize, viewHeight, isAuto) {
            var dayGrid = this.dayGrid;
            var eventLimit = this.context.options.eventLimit;
            var headRowEl = this.header ? this.header.el : null; // HACK
            var scrollerHeight;
            var scrollbarWidths;
            // hack to give the view some height prior to dayGrid's columns being rendered
            // TODO: separate setting height from scroller VS dayGrid.
            if (!dayGrid.rowEls) {
                if (!isAuto) {
                    scrollerHeight = this.computeScrollerHeight(viewHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                return;
            }
            if (this.colWeekNumbersVisible) {
                // Make sure all week number cells running down the side have the same width.
                this.weekNumberWidth = core.matchCellWidths(core.findElements(this.el, '.fc-week-number'));
            }
            // reset all heights to be natural
            this.scroller.clear();
            if (headRowEl) {
                core.uncompensateScroll(headRowEl);
            }
            dayGrid.removeSegPopover(); // kill the "more" popover if displayed
            // is the event limit a constant level number?
            if (eventLimit && typeof eventLimit === 'number') {
                dayGrid.limitRows(eventLimit); // limit the levels first so the height can redistribute after
            }
            // distribute the height to the rows
            // (viewHeight is a "recommended" value if isAuto)
            scrollerHeight = this.computeScrollerHeight(viewHeight);
            this.setGridHeight(scrollerHeight, isAuto);
            // is the event limit dynamically calculated?
            if (eventLimit && typeof eventLimit !== 'number') {
                dayGrid.limitRows(eventLimit); // limit the levels after the grid's row heights have been set
            }
            if (!isAuto) { // should we force dimensions of the scroll container?
                this.scroller.setHeight(scrollerHeight);
                scrollbarWidths = this.scroller.getScrollbarWidths();
                if (scrollbarWidths.left || scrollbarWidths.right) { // using scrollbars?
                    if (headRowEl) {
                        core.compensateScroll(headRowEl, scrollbarWidths);
                    }
                    // doing the scrollbar compensation might have created text overflow which created more height. redo
                    scrollerHeight = this.computeScrollerHeight(viewHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                // guarantees the same scrollbar widths
                this.scroller.lockOverflow(scrollbarWidths);
            }
        };
        // given a desired total height of the view, returns what the height of the scroller should be
        AbstractDayGridView.prototype.computeScrollerHeight = function (viewHeight) {
            return viewHeight -
                core.subtractInnerElHeight(this.el, this.scroller.el); // everything that's NOT the scroller
        };
        // Sets the height of just the DayGrid component in this view
        AbstractDayGridView.prototype.setGridHeight = function (height, isAuto) {
            if (this.context.options.monthMode) {
                // if auto, make the height of each row the height that it would be if there were 6 weeks
                if (isAuto) {
                    height *= this.dayGrid.rowCnt / 6;
                }
                core.distributeHeight(this.dayGrid.rowEls, height, !isAuto); // if auto, don't compensate for height-hogging rows
            }
            else {
                if (isAuto) {
                    core.undistributeHeight(this.dayGrid.rowEls); // let the rows be their natural height with no expanding
                }
                else {
                    core.distributeHeight(this.dayGrid.rowEls, height, true); // true = compensate for height-hogging rows
                }
            }
        };
        /* Scroll
        ------------------------------------------------------------------------------------------------------------------*/
        AbstractDayGridView.prototype.computeDateScroll = function (duration) {
            return { top: 0 };
        };
        AbstractDayGridView.prototype.queryDateScroll = function () {
            return { top: this.scroller.getScrollTop() };
        };
        AbstractDayGridView.prototype.applyDateScroll = function (scroll) {
            if (scroll.top !== undefined) {
                this.scroller.setScrollTop(scroll.top);
            }
        };
        return AbstractDayGridView;
    }(core.View));
    AbstractDayGridView.prototype.dateProfileGeneratorClass = DayGridDateProfileGenerator;

    var SimpleDayGrid = /** @class */ (function (_super) {
        __extends(SimpleDayGrid, _super);
        function SimpleDayGrid(dayGrid) {
            var _this = _super.call(this, dayGrid.el) || this;
            _this.slicer = new DayGridSlicer();
            _this.dayGrid = dayGrid;
            return _this;
        }
        SimpleDayGrid.prototype.firstContext = function (context) {
            context.calendar.registerInteractiveComponent(this, { el: this.dayGrid.el });
        };
        SimpleDayGrid.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.context.calendar.unregisterInteractiveComponent(this);
        };
        SimpleDayGrid.prototype.render = function (props, context) {
            var dayGrid = this.dayGrid;
            var dateProfile = props.dateProfile, dayTable = props.dayTable;
            dayGrid.receiveContext(context); // hack because context is used in sliceProps
            dayGrid.receiveProps(__assign({}, this.slicer.sliceProps(props, dateProfile, props.nextDayThreshold, context.calendar, dayGrid, dayTable), { dateProfile: dateProfile, cells: dayTable.cells, isRigid: props.isRigid }), context);
        };
        SimpleDayGrid.prototype.buildPositionCaches = function () {
            this.dayGrid.buildPositionCaches();
        };
        SimpleDayGrid.prototype.queryHit = function (positionLeft, positionTop) {
            var rawHit = this.dayGrid.positionToHit(positionLeft, positionTop);
            if (rawHit) {
                return {
                    component: this.dayGrid,
                    dateSpan: rawHit.dateSpan,
                    dayEl: rawHit.dayEl,
                    rect: {
                        left: rawHit.relativeRect.left,
                        right: rawHit.relativeRect.right,
                        top: rawHit.relativeRect.top,
                        bottom: rawHit.relativeRect.bottom
                    },
                    layer: 0
                };
            }
        };
        return SimpleDayGrid;
    }(core.DateComponent));
    var DayGridSlicer = /** @class */ (function (_super) {
        __extends(DayGridSlicer, _super);
        function DayGridSlicer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DayGridSlicer.prototype.sliceRange = function (dateRange, dayTable) {
            return dayTable.sliceRange(dateRange);
        };
        return DayGridSlicer;
    }(core.Slicer));

    var DayGridView = /** @class */ (function (_super) {
        __extends(DayGridView, _super);
        function DayGridView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.buildDayTable = core.memoize(buildDayTable);
            return _this;
        }
        DayGridView.prototype.render = function (props, context) {
            _super.prototype.render.call(this, props, context); // will call _renderSkeleton/_unrenderSkeleton
            var dateProfile = this.props.dateProfile;
            var dayTable = this.dayTable =
                this.buildDayTable(dateProfile, props.dateProfileGenerator);
            if (this.header) {
                this.header.receiveProps({
                    dateProfile: dateProfile,
                    dates: dayTable.headerDates,
                    datesRepDistinctDays: dayTable.rowCnt === 1,
                    renderIntroHtml: this.renderHeadIntroHtml
                }, context);
            }
            this.simpleDayGrid.receiveProps({
                dateProfile: dateProfile,
                dayTable: dayTable,
                businessHours: props.businessHours,
                dateSelection: props.dateSelection,
                eventStore: props.eventStore,
                eventUiBases: props.eventUiBases,
                eventSelection: props.eventSelection,
                eventDrag: props.eventDrag,
                eventResize: props.eventResize,
                isRigid: this.hasRigidRows(),
                nextDayThreshold: this.context.nextDayThreshold
            }, context);
        };
        DayGridView.prototype._renderSkeleton = function (context) {
            _super.prototype._renderSkeleton.call(this, context);
            if (context.options.columnHeader) {
                this.header = new core.DayHeader(this.el.querySelector('.fc-head-container'));
            }
            this.simpleDayGrid = new SimpleDayGrid(this.dayGrid);
        };
        DayGridView.prototype._unrenderSkeleton = function () {
            _super.prototype._unrenderSkeleton.call(this);
            if (this.header) {
                this.header.destroy();
            }
            this.simpleDayGrid.destroy();
        };
        return DayGridView;
    }(AbstractDayGridView));
    function buildDayTable(dateProfile, dateProfileGenerator) {
        var daySeries = new core.DaySeries(dateProfile.renderRange, dateProfileGenerator);
        return new core.DayTable(daySeries, /year|month|week/.test(dateProfile.currentRangeUnit));
    }

    var main = core.createPlugin({
        defaultView: 'dayGridMonth',
        views: {
            dayGrid: DayGridView,
            dayGridDay: {
                type: 'dayGrid',
                duration: { days: 1 }
            },
            dayGridWeek: {
                type: 'dayGrid',
                duration: { weeks: 1 }
            },
            dayGridMonth: {
                type: 'dayGrid',
                duration: { months: 1 },
                monthMode: true,
                fixedWeekCount: true
            }
        }
    });

    exports.AbstractDayGridView = AbstractDayGridView;
    exports.DayBgRow = DayBgRow;
    exports.DayGrid = DayGrid;
    exports.DayGridSlicer = DayGridSlicer;
    exports.DayGridView = DayGridView;
    exports.SimpleDayGrid = SimpleDayGrid;
    exports.buildBasicDayTable = buildDayTable;
    exports.default = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

/*!
FullCalendar Google Calendar Plugin v4.4.2
Docs & License: https://fullcalendar.io/
(c) 2019 Adam Shaw
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fullcalendar/core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fullcalendar/core'], factory) :
    (global = global || self, factory(global.FullCalendarGoogleCalendar = {}, global.FullCalendar));
}(this, function (exports, core) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    // TODO: expose somehow
    var API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
    var STANDARD_PROPS = {
        url: String,
        googleCalendarApiKey: String,
        googleCalendarId: String,
        googleCalendarApiBase: String,
        data: null
    };
    var eventSourceDef = {
        parseMeta: function (raw) {
            if (typeof raw === 'string') {
                raw = { url: raw };
            }
            if (typeof raw === 'object') {
                var standardProps = core.refineProps(raw, STANDARD_PROPS);
                if (!standardProps.googleCalendarId && standardProps.url) {
                    standardProps.googleCalendarId = parseGoogleCalendarId(standardProps.url);
                }
                delete standardProps.url;
                if (standardProps.googleCalendarId) {
                    return standardProps;
                }
            }
            return null;
        },
        fetch: function (arg, onSuccess, onFailure) {
            var calendar = arg.calendar;
            var meta = arg.eventSource.meta;
            var apiKey = meta.googleCalendarApiKey || calendar.opt('googleCalendarApiKey');
            if (!apiKey) {
                onFailure({
                    message: 'Specify a googleCalendarApiKey. See http://fullcalendar.io/docs/google_calendar/'
                });
            }
            else {
                var url = buildUrl(meta);
                var requestParams_1 = buildRequestParams(arg.range, apiKey, meta.data, calendar.dateEnv);
                core.requestJson('GET', url, requestParams_1, function (body, xhr) {
                    if (body.error) {
                        onFailure({
                            message: 'Google Calendar API: ' + body.error.message,
                            errors: body.error.errors,
                            xhr: xhr
                        });
                    }
                    else {
                        onSuccess({
                            rawEvents: gcalItemsToRawEventDefs(body.items, requestParams_1.timeZone),
                            xhr: xhr
                        });
                    }
                }, function (message, xhr) {
                    onFailure({ message: message, xhr: xhr });
                });
            }
        }
    };
    function parseGoogleCalendarId(url) {
        var match;
        // detect if the ID was specified as a single string.
        // will match calendars like "asdf1234@calendar.google.com" in addition to person email calendars.
        if (/^[^\/]+@([^\/\.]+\.)*(google|googlemail|gmail)\.com$/.test(url)) {
            return url;
        }
        else if ((match = /^https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/([^\/]*)/.exec(url)) ||
            (match = /^https?:\/\/www.google.com\/calendar\/feeds\/([^\/]*)/.exec(url))) {
            return decodeURIComponent(match[1]);
        }
    }
    function buildUrl(meta) {
        var apiBase = meta.googleCalendarApiBase;
        if (!apiBase) {
            apiBase = API_BASE;
        }
        return apiBase + '/' + encodeURIComponent(meta.googleCalendarId) + '/events';
    }
    function buildRequestParams(range, apiKey, extraParams, dateEnv) {
        var params;
        var startStr;
        var endStr;
        if (dateEnv.canComputeOffset) {
            // strings will naturally have offsets, which GCal needs
            startStr = dateEnv.formatIso(range.start);
            endStr = dateEnv.formatIso(range.end);
        }
        else {
            // when timezone isn't known, we don't know what the UTC offset should be, so ask for +/- 1 day
            // from the UTC day-start to guarantee we're getting all the events
            // (start/end will be UTC-coerced dates, so toISOString is okay)
            startStr = core.addDays(range.start, -1).toISOString();
            endStr = core.addDays(range.end, 1).toISOString();
        }
        params = __assign({}, (extraParams || {}), { key: apiKey, timeMin: startStr, timeMax: endStr, singleEvents: true, maxResults: 9999 });
        if (dateEnv.timeZone !== 'local') {
            params.timeZone = dateEnv.timeZone;
        }
        return params;
    }
    function gcalItemsToRawEventDefs(items, gcalTimezone) {
        return items.map(function (item) {
            return gcalItemToRawEventDef(item, gcalTimezone);
        });
    }
    function gcalItemToRawEventDef(item, gcalTimezone) {
        var url = item.htmlLink || null;
        // make the URLs for each event show times in the correct timezone
        if (url && gcalTimezone) {
            url = injectQsComponent(url, 'ctz=' + gcalTimezone);
        }
        return {
            id: item.id,
            title: item.summary,
            start: item.start.dateTime || item.start.date,
            end: item.end.dateTime || item.end.date,
            url: url,
            location: item.location,
            description: item.description
        };
    }
    // Injects a string like "arg=value" into the querystring of a URL
    // TODO: move to a general util file?
    function injectQsComponent(url, component) {
        // inject it after the querystring but before the fragment
        return url.replace(/(\?.*?)?(#|$)/, function (whole, qs, hash) {
            return (qs ? qs + '&' : '?') + component + hash;
        });
    }
    var main = core.createPlugin({
        eventSourceDefs: [eventSourceDef]
    });

    exports.default = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

/*!
FullCalendar Interaction Plugin v4.4.2
Docs & License: https://fullcalendar.io/
(c) 2019 Adam Shaw
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fullcalendar/core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fullcalendar/core'], factory) :
    (global = global || self, factory(global.FullCalendarInteraction = {}, global.FullCalendar));
}(this, function (exports, core) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    core.config.touchMouseIgnoreWait = 500;
    var ignoreMouseDepth = 0;
    var listenerCnt = 0;
    var isWindowTouchMoveCancelled = false;
    /*
    Uses a "pointer" abstraction, which monitors UI events for both mouse and touch.
    Tracks when the pointer "drags" on a certain element, meaning down+move+up.

    Also, tracks if there was touch-scrolling.
    Also, can prevent touch-scrolling from happening.
    Also, can fire pointermove events when scrolling happens underneath, even when no real pointer movement.

    emits:
    - pointerdown
    - pointermove
    - pointerup
    */
    var PointerDragging = /** @class */ (function () {
        function PointerDragging(containerEl) {
            var _this = this;
            this.subjectEl = null;
            this.downEl = null;
            // options that can be directly assigned by caller
            this.selector = ''; // will cause subjectEl in all emitted events to be this element
            this.handleSelector = '';
            this.shouldIgnoreMove = false;
            this.shouldWatchScroll = true; // for simulating pointermove on scroll
            // internal states
            this.isDragging = false;
            this.isTouchDragging = false;
            this.wasTouchScroll = false;
            // Mouse
            // ----------------------------------------------------------------------------------------------------
            this.handleMouseDown = function (ev) {
                if (!_this.shouldIgnoreMouse() &&
                    isPrimaryMouseButton(ev) &&
                    _this.tryStart(ev)) {
                    var pev = _this.createEventFromMouse(ev, true);
                    _this.emitter.trigger('pointerdown', pev);
                    _this.initScrollWatch(pev);
                    if (!_this.shouldIgnoreMove) {
                        document.addEventListener('mousemove', _this.handleMouseMove);
                    }
                    document.addEventListener('mouseup', _this.handleMouseUp);
                }
            };
            this.handleMouseMove = function (ev) {
                var pev = _this.createEventFromMouse(ev);
                _this.recordCoords(pev);
                _this.emitter.trigger('pointermove', pev);
            };
            this.handleMouseUp = function (ev) {
                document.removeEventListener('mousemove', _this.handleMouseMove);
                document.removeEventListener('mouseup', _this.handleMouseUp);
                _this.emitter.trigger('pointerup', _this.createEventFromMouse(ev));
                _this.cleanup(); // call last so that pointerup has access to props
            };
            // Touch
            // ----------------------------------------------------------------------------------------------------
            this.handleTouchStart = function (ev) {
                if (_this.tryStart(ev)) {
                    _this.isTouchDragging = true;
                    var pev = _this.createEventFromTouch(ev, true);
                    _this.emitter.trigger('pointerdown', pev);
                    _this.initScrollWatch(pev);
                    // unlike mouse, need to attach to target, not document
                    // https://stackoverflow.com/a/45760014
                    var target = ev.target;
                    if (!_this.shouldIgnoreMove) {
                        target.addEventListener('touchmove', _this.handleTouchMove);
                    }
                    target.addEventListener('touchend', _this.handleTouchEnd);
                    target.addEventListener('touchcancel', _this.handleTouchEnd); // treat it as a touch end
                    // attach a handler to get called when ANY scroll action happens on the page.
                    // this was impossible to do with normal on/off because 'scroll' doesn't bubble.
                    // http://stackoverflow.com/a/32954565/96342
                    window.addEventListener('scroll', _this.handleTouchScroll, true // useCapture
                    );
                }
            };
            this.handleTouchMove = function (ev) {
                var pev = _this.createEventFromTouch(ev);
                _this.recordCoords(pev);
                _this.emitter.trigger('pointermove', pev);
            };
            this.handleTouchEnd = function (ev) {
                if (_this.isDragging) { // done to guard against touchend followed by touchcancel
                    var target = ev.target;
                    target.removeEventListener('touchmove', _this.handleTouchMove);
                    target.removeEventListener('touchend', _this.handleTouchEnd);
                    target.removeEventListener('touchcancel', _this.handleTouchEnd);
                    window.removeEventListener('scroll', _this.handleTouchScroll, true); // useCaptured=true
                    _this.emitter.trigger('pointerup', _this.createEventFromTouch(ev));
                    _this.cleanup(); // call last so that pointerup has access to props
                    _this.isTouchDragging = false;
                    startIgnoringMouse();
                }
            };
            this.handleTouchScroll = function () {
                _this.wasTouchScroll = true;
            };
            this.handleScroll = function (ev) {
                if (!_this.shouldIgnoreMove) {
                    var pageX = (window.pageXOffset - _this.prevScrollX) + _this.prevPageX;
                    var pageY = (window.pageYOffset - _this.prevScrollY) + _this.prevPageY;
                    _this.emitter.trigger('pointermove', {
                        origEvent: ev,
                        isTouch: _this.isTouchDragging,
                        subjectEl: _this.subjectEl,
                        pageX: pageX,
                        pageY: pageY,
                        deltaX: pageX - _this.origPageX,
                        deltaY: pageY - _this.origPageY
                    });
                }
            };
            this.containerEl = containerEl;
            this.emitter = new core.EmitterMixin();
            containerEl.addEventListener('mousedown', this.handleMouseDown);
            containerEl.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            listenerCreated();
        }
        PointerDragging.prototype.destroy = function () {
            this.containerEl.removeEventListener('mousedown', this.handleMouseDown);
            this.containerEl.removeEventListener('touchstart', this.handleTouchStart, { passive: true });
            listenerDestroyed();
        };
        PointerDragging.prototype.tryStart = function (ev) {
            var subjectEl = this.querySubjectEl(ev);
            var downEl = ev.target;
            if (subjectEl &&
                (!this.handleSelector || core.elementClosest(downEl, this.handleSelector))) {
                this.subjectEl = subjectEl;
                this.downEl = downEl;
                this.isDragging = true; // do this first so cancelTouchScroll will work
                this.wasTouchScroll = false;
                return true;
            }
            return false;
        };
        PointerDragging.prototype.cleanup = function () {
            isWindowTouchMoveCancelled = false;
            this.isDragging = false;
            this.subjectEl = null;
            this.downEl = null;
            // keep wasTouchScroll around for later access
            this.destroyScrollWatch();
        };
        PointerDragging.prototype.querySubjectEl = function (ev) {
            if (this.selector) {
                return core.elementClosest(ev.target, this.selector);
            }
            else {
                return this.containerEl;
            }
        };
        PointerDragging.prototype.shouldIgnoreMouse = function () {
            return ignoreMouseDepth || this.isTouchDragging;
        };
        // can be called by user of this class, to cancel touch-based scrolling for the current drag
        PointerDragging.prototype.cancelTouchScroll = function () {
            if (this.isDragging) {
                isWindowTouchMoveCancelled = true;
            }
        };
        // Scrolling that simulates pointermoves
        // ----------------------------------------------------------------------------------------------------
        PointerDragging.prototype.initScrollWatch = function (ev) {
            if (this.shouldWatchScroll) {
                this.recordCoords(ev);
                window.addEventListener('scroll', this.handleScroll, true); // useCapture=true
            }
        };
        PointerDragging.prototype.recordCoords = function (ev) {
            if (this.shouldWatchScroll) {
                this.prevPageX = ev.pageX;
                this.prevPageY = ev.pageY;
                this.prevScrollX = window.pageXOffset;
                this.prevScrollY = window.pageYOffset;
            }
        };
        PointerDragging.prototype.destroyScrollWatch = function () {
            if (this.shouldWatchScroll) {
                window.removeEventListener('scroll', this.handleScroll, true); // useCaptured=true
            }
        };
        // Event Normalization
        // ----------------------------------------------------------------------------------------------------
        PointerDragging.prototype.createEventFromMouse = function (ev, isFirst) {
            var deltaX = 0;
            var deltaY = 0;
            // TODO: repeat code
            if (isFirst) {
                this.origPageX = ev.pageX;
                this.origPageY = ev.pageY;
            }
            else {
                deltaX = ev.pageX - this.origPageX;
                deltaY = ev.pageY - this.origPageY;
            }
            return {
                origEvent: ev,
                isTouch: false,
                subjectEl: this.subjectEl,
                pageX: ev.pageX,
                pageY: ev.pageY,
                deltaX: deltaX,
                deltaY: deltaY
            };
        };
        PointerDragging.prototype.createEventFromTouch = function (ev, isFirst) {
            var touches = ev.touches;
            var pageX;
            var pageY;
            var deltaX = 0;
            var deltaY = 0;
            // if touch coords available, prefer,
            // because FF would give bad ev.pageX ev.pageY
            if (touches && touches.length) {
                pageX = touches[0].pageX;
                pageY = touches[0].pageY;
            }
            else {
                pageX = ev.pageX;
                pageY = ev.pageY;
            }
            // TODO: repeat code
            if (isFirst) {
                this.origPageX = pageX;
                this.origPageY = pageY;
            }
            else {
                deltaX = pageX - this.origPageX;
                deltaY = pageY - this.origPageY;
            }
            return {
                origEvent: ev,
                isTouch: true,
                subjectEl: this.subjectEl,
                pageX: pageX,
                pageY: pageY,
                deltaX: deltaX,
                deltaY: deltaY
            };
        };
        return PointerDragging;
    }());
    // Returns a boolean whether this was a left mouse click and no ctrl key (which means right click on Mac)
    function isPrimaryMouseButton(ev) {
        return ev.button === 0 && !ev.ctrlKey;
    }
    // Ignoring fake mouse events generated by touch
    // ----------------------------------------------------------------------------------------------------
    function startIgnoringMouse() {
        ignoreMouseDepth++;
        setTimeout(function () {
            ignoreMouseDepth--;
        }, core.config.touchMouseIgnoreWait);
    }
    // We want to attach touchmove as early as possible for Safari
    // ----------------------------------------------------------------------------------------------------
    function listenerCreated() {
        if (!(listenerCnt++)) {
            window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
        }
    }
    function listenerDestroyed() {
        if (!(--listenerCnt)) {
            window.removeEventListener('touchmove', onWindowTouchMove, { passive: false });
        }
    }
    function onWindowTouchMove(ev) {
        if (isWindowTouchMoveCancelled) {
            ev.preventDefault();
        }
    }

    /*
    An effect in which an element follows the movement of a pointer across the screen.
    The moving element is a clone of some other element.
    Must call start + handleMove + stop.
    */
    var ElementMirror = /** @class */ (function () {
        function ElementMirror() {
            this.isVisible = false; // must be explicitly enabled
            this.sourceEl = null;
            this.mirrorEl = null;
            this.sourceElRect = null; // screen coords relative to viewport
            // options that can be set directly by caller
            this.parentNode = document.body;
            this.zIndex = 9999;
            this.revertDuration = 0;
        }
        ElementMirror.prototype.start = function (sourceEl, pageX, pageY) {
            this.sourceEl = sourceEl;
            this.sourceElRect = this.sourceEl.getBoundingClientRect();
            this.origScreenX = pageX - window.pageXOffset;
            this.origScreenY = pageY - window.pageYOffset;
            this.deltaX = 0;
            this.deltaY = 0;
            this.updateElPosition();
        };
        ElementMirror.prototype.handleMove = function (pageX, pageY) {
            this.deltaX = (pageX - window.pageXOffset) - this.origScreenX;
            this.deltaY = (pageY - window.pageYOffset) - this.origScreenY;
            this.updateElPosition();
        };
        // can be called before start
        ElementMirror.prototype.setIsVisible = function (bool) {
            if (bool) {
                if (!this.isVisible) {
                    if (this.mirrorEl) {
                        this.mirrorEl.style.display = '';
                    }
                    this.isVisible = bool; // needs to happen before updateElPosition
                    this.updateElPosition(); // because was not updating the position while invisible
                }
            }
            else {
                if (this.isVisible) {
                    if (this.mirrorEl) {
                        this.mirrorEl.style.display = 'none';
                    }
                    this.isVisible = bool;
                }
            }
        };
        // always async
        ElementMirror.prototype.stop = function (needsRevertAnimation, callback) {
            var _this = this;
            var done = function () {
                _this.cleanup();
                callback();
            };
            if (needsRevertAnimation &&
                this.mirrorEl &&
                this.isVisible &&
                this.revertDuration && // if 0, transition won't work
                (this.deltaX || this.deltaY) // if same coords, transition won't work
            ) {
                this.doRevertAnimation(done, this.revertDuration);
            }
            else {
                setTimeout(done, 0);
            }
        };
        ElementMirror.prototype.doRevertAnimation = function (callback, revertDuration) {
            var mirrorEl = this.mirrorEl;
            var finalSourceElRect = this.sourceEl.getBoundingClientRect(); // because autoscrolling might have happened
            mirrorEl.style.transition =
                'top ' + revertDuration + 'ms,' +
                    'left ' + revertDuration + 'ms';
            core.applyStyle(mirrorEl, {
                left: finalSourceElRect.left,
                top: finalSourceElRect.top
            });
            core.whenTransitionDone(mirrorEl, function () {
                mirrorEl.style.transition = '';
                callback();
            });
        };
        ElementMirror.prototype.cleanup = function () {
            if (this.mirrorEl) {
                core.removeElement(this.mirrorEl);
                this.mirrorEl = null;
            }
            this.sourceEl = null;
        };
        ElementMirror.prototype.updateElPosition = function () {
            if (this.sourceEl && this.isVisible) {
                core.applyStyle(this.getMirrorEl(), {
                    left: this.sourceElRect.left + this.deltaX,
                    top: this.sourceElRect.top + this.deltaY
                });
            }
        };
        ElementMirror.prototype.getMirrorEl = function () {
            var sourceElRect = this.sourceElRect;
            var mirrorEl = this.mirrorEl;
            if (!mirrorEl) {
                mirrorEl = this.mirrorEl = this.sourceEl.cloneNode(true); // cloneChildren=true
                // we don't want long taps or any mouse interaction causing selection/menus.
                // would use preventSelection(), but that prevents selectstart, causing problems.
                mirrorEl.classList.add('fc-unselectable');
                mirrorEl.classList.add('fc-dragging');
                core.applyStyle(mirrorEl, {
                    position: 'fixed',
                    zIndex: this.zIndex,
                    visibility: '',
                    boxSizing: 'border-box',
                    width: sourceElRect.right - sourceElRect.left,
                    height: sourceElRect.bottom - sourceElRect.top,
                    right: 'auto',
                    bottom: 'auto',
                    margin: 0
                });
                this.parentNode.appendChild(mirrorEl);
            }
            return mirrorEl;
        };
        return ElementMirror;
    }());

    /*
    Is a cache for a given element's scroll information (all the info that ScrollController stores)
    in addition the "client rectangle" of the element.. the area within the scrollbars.

    The cache can be in one of two modes:
    - doesListening:false - ignores when the container is scrolled by someone else
    - doesListening:true - watch for scrolling and update the cache
    */
    var ScrollGeomCache = /** @class */ (function (_super) {
        __extends(ScrollGeomCache, _super);
        function ScrollGeomCache(scrollController, doesListening) {
            var _this = _super.call(this) || this;
            _this.handleScroll = function () {
                _this.scrollTop = _this.scrollController.getScrollTop();
                _this.scrollLeft = _this.scrollController.getScrollLeft();
                _this.handleScrollChange();
            };
            _this.scrollController = scrollController;
            _this.doesListening = doesListening;
            _this.scrollTop = _this.origScrollTop = scrollController.getScrollTop();
            _this.scrollLeft = _this.origScrollLeft = scrollController.getScrollLeft();
            _this.scrollWidth = scrollController.getScrollWidth();
            _this.scrollHeight = scrollController.getScrollHeight();
            _this.clientWidth = scrollController.getClientWidth();
            _this.clientHeight = scrollController.getClientHeight();
            _this.clientRect = _this.computeClientRect(); // do last in case it needs cached values
            if (_this.doesListening) {
                _this.getEventTarget().addEventListener('scroll', _this.handleScroll);
            }
            return _this;
        }
        ScrollGeomCache.prototype.destroy = function () {
            if (this.doesListening) {
                this.getEventTarget().removeEventListener('scroll', this.handleScroll);
            }
        };
        ScrollGeomCache.prototype.getScrollTop = function () {
            return this.scrollTop;
        };
        ScrollGeomCache.prototype.getScrollLeft = function () {
            return this.scrollLeft;
        };
        ScrollGeomCache.prototype.setScrollTop = function (top) {
            this.scrollController.setScrollTop(top);
            if (!this.doesListening) {
                // we are not relying on the element to normalize out-of-bounds scroll values
                // so we need to sanitize ourselves
                this.scrollTop = Math.max(Math.min(top, this.getMaxScrollTop()), 0);
                this.handleScrollChange();
            }
        };
        ScrollGeomCache.prototype.setScrollLeft = function (top) {
            this.scrollController.setScrollLeft(top);
            if (!this.doesListening) {
                // we are not relying on the element to normalize out-of-bounds scroll values
                // so we need to sanitize ourselves
                this.scrollLeft = Math.max(Math.min(top, this.getMaxScrollLeft()), 0);
                this.handleScrollChange();
            }
        };
        ScrollGeomCache.prototype.getClientWidth = function () {
            return this.clientWidth;
        };
        ScrollGeomCache.prototype.getClientHeight = function () {
            return this.clientHeight;
        };
        ScrollGeomCache.prototype.getScrollWidth = function () {
            return this.scrollWidth;
        };
        ScrollGeomCache.prototype.getScrollHeight = function () {
            return this.scrollHeight;
        };
        ScrollGeomCache.prototype.handleScrollChange = function () {
        };
        return ScrollGeomCache;
    }(core.ScrollController));
    var ElementScrollGeomCache = /** @class */ (function (_super) {
        __extends(ElementScrollGeomCache, _super);
        function ElementScrollGeomCache(el, doesListening) {
            return _super.call(this, new core.ElementScrollController(el), doesListening) || this;
        }
        ElementScrollGeomCache.prototype.getEventTarget = function () {
            return this.scrollController.el;
        };
        ElementScrollGeomCache.prototype.computeClientRect = function () {
            return core.computeInnerRect(this.scrollController.el);
        };
        return ElementScrollGeomCache;
    }(ScrollGeomCache));
    var WindowScrollGeomCache = /** @class */ (function (_super) {
        __extends(WindowScrollGeomCache, _super);
        function WindowScrollGeomCache(doesListening) {
            return _super.call(this, new core.WindowScrollController(), doesListening) || this;
        }
        WindowScrollGeomCache.prototype.getEventTarget = function () {
            return window;
        };
        WindowScrollGeomCache.prototype.computeClientRect = function () {
            return {
                left: this.scrollLeft,
                right: this.scrollLeft + this.clientWidth,
                top: this.scrollTop,
                bottom: this.scrollTop + this.clientHeight
            };
        };
        // the window is the only scroll object that changes it's rectangle relative
        // to the document's topleft as it scrolls
        WindowScrollGeomCache.prototype.handleScrollChange = function () {
            this.clientRect = this.computeClientRect();
        };
        return WindowScrollGeomCache;
    }(ScrollGeomCache));

    // If available we are using native "performance" API instead of "Date"
    // Read more about it on MDN:
    // https://developer.mozilla.org/en-US/docs/Web/API/Performance
    var getTime = typeof performance === 'function' ? performance.now : Date.now;
    /*
    For a pointer interaction, automatically scrolls certain scroll containers when the pointer
    approaches the edge.

    The caller must call start + handleMove + stop.
    */
    var AutoScroller = /** @class */ (function () {
        function AutoScroller() {
            var _this = this;
            // options that can be set by caller
            this.isEnabled = true;
            this.scrollQuery = [window, '.fc-scroller'];
            this.edgeThreshold = 50; // pixels
            this.maxVelocity = 300; // pixels per second
            // internal state
            this.pointerScreenX = null;
            this.pointerScreenY = null;
            this.isAnimating = false;
            this.scrollCaches = null;
            // protect against the initial pointerdown being too close to an edge and starting the scroll
            this.everMovedUp = false;
            this.everMovedDown = false;
            this.everMovedLeft = false;
            this.everMovedRight = false;
            this.animate = function () {
                if (_this.isAnimating) { // wasn't cancelled between animation calls
                    var edge = _this.computeBestEdge(_this.pointerScreenX + window.pageXOffset, _this.pointerScreenY + window.pageYOffset);
                    if (edge) {
                        var now = getTime();
                        _this.handleSide(edge, (now - _this.msSinceRequest) / 1000);
                        _this.requestAnimation(now);
                    }
                    else {
                        _this.isAnimating = false; // will stop animation
                    }
                }
            };
        }
        AutoScroller.prototype.start = function (pageX, pageY) {
            if (this.isEnabled) {
                this.scrollCaches = this.buildCaches();
                this.pointerScreenX = null;
                this.pointerScreenY = null;
                this.everMovedUp = false;
                this.everMovedDown = false;
                this.everMovedLeft = false;
                this.everMovedRight = false;
                this.handleMove(pageX, pageY);
            }
        };
        AutoScroller.prototype.handleMove = function (pageX, pageY) {
            if (this.isEnabled) {
                var pointerScreenX = pageX - window.pageXOffset;
                var pointerScreenY = pageY - window.pageYOffset;
                var yDelta = this.pointerScreenY === null ? 0 : pointerScreenY - this.pointerScreenY;
                var xDelta = this.pointerScreenX === null ? 0 : pointerScreenX - this.pointerScreenX;
                if (yDelta < 0) {
                    this.everMovedUp = true;
                }
                else if (yDelta > 0) {
                    this.everMovedDown = true;
                }
                if (xDelta < 0) {
                    this.everMovedLeft = true;
                }
                else if (xDelta > 0) {
                    this.everMovedRight = true;
                }
                this.pointerScreenX = pointerScreenX;
                this.pointerScreenY = pointerScreenY;
                if (!this.isAnimating) {
                    this.isAnimating = true;
                    this.requestAnimation(getTime());
                }
            }
        };
        AutoScroller.prototype.stop = function () {
            if (this.isEnabled) {
                this.isAnimating = false; // will stop animation
                for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                    var scrollCache = _a[_i];
                    scrollCache.destroy();
                }
                this.scrollCaches = null;
            }
        };
        AutoScroller.prototype.requestAnimation = function (now) {
            this.msSinceRequest = now;
            requestAnimationFrame(this.animate);
        };
        AutoScroller.prototype.handleSide = function (edge, seconds) {
            var scrollCache = edge.scrollCache;
            var edgeThreshold = this.edgeThreshold;
            var invDistance = edgeThreshold - edge.distance;
            var velocity = // the closer to the edge, the faster we scroll
             (invDistance * invDistance) / (edgeThreshold * edgeThreshold) * // quadratic
                this.maxVelocity * seconds;
            var sign = 1;
            switch (edge.name) {
                case 'left':
                    sign = -1;
                // falls through
                case 'right':
                    scrollCache.setScrollLeft(scrollCache.getScrollLeft() + velocity * sign);
                    break;
                case 'top':
                    sign = -1;
                // falls through
                case 'bottom':
                    scrollCache.setScrollTop(scrollCache.getScrollTop() + velocity * sign);
                    break;
            }
        };
        // left/top are relative to document topleft
        AutoScroller.prototype.computeBestEdge = function (left, top) {
            var edgeThreshold = this.edgeThreshold;
            var bestSide = null;
            for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                var scrollCache = _a[_i];
                var rect = scrollCache.clientRect;
                var leftDist = left - rect.left;
                var rightDist = rect.right - left;
                var topDist = top - rect.top;
                var bottomDist = rect.bottom - top;
                // completely within the rect?
                if (leftDist >= 0 && rightDist >= 0 && topDist >= 0 && bottomDist >= 0) {
                    if (topDist <= edgeThreshold && this.everMovedUp && scrollCache.canScrollUp() &&
                        (!bestSide || bestSide.distance > topDist)) {
                        bestSide = { scrollCache: scrollCache, name: 'top', distance: topDist };
                    }
                    if (bottomDist <= edgeThreshold && this.everMovedDown && scrollCache.canScrollDown() &&
                        (!bestSide || bestSide.distance > bottomDist)) {
                        bestSide = { scrollCache: scrollCache, name: 'bottom', distance: bottomDist };
                    }
                    if (leftDist <= edgeThreshold && this.everMovedLeft && scrollCache.canScrollLeft() &&
                        (!bestSide || bestSide.distance > leftDist)) {
                        bestSide = { scrollCache: scrollCache, name: 'left', distance: leftDist };
                    }
                    if (rightDist <= edgeThreshold && this.everMovedRight && scrollCache.canScrollRight() &&
                        (!bestSide || bestSide.distance > rightDist)) {
                        bestSide = { scrollCache: scrollCache, name: 'right', distance: rightDist };
                    }
                }
            }
            return bestSide;
        };
        AutoScroller.prototype.buildCaches = function () {
            return this.queryScrollEls().map(function (el) {
                if (el === window) {
                    return new WindowScrollGeomCache(false); // false = don't listen to user-generated scrolls
                }
                else {
                    return new ElementScrollGeomCache(el, false); // false = don't listen to user-generated scrolls
                }
            });
        };
        AutoScroller.prototype.queryScrollEls = function () {
            var els = [];
            for (var _i = 0, _a = this.scrollQuery; _i < _a.length; _i++) {
                var query = _a[_i];
                if (typeof query === 'object') {
                    els.push(query);
                }
                else {
                    els.push.apply(els, Array.prototype.slice.call(document.querySelectorAll(query)));
                }
            }
            return els;
        };
        return AutoScroller;
    }());

    /*
    Monitors dragging on an element. Has a number of high-level features:
    - minimum distance required before dragging
    - minimum wait time ("delay") before dragging
    - a mirror element that follows the pointer
    */
    var FeaturefulElementDragging = /** @class */ (function (_super) {
        __extends(FeaturefulElementDragging, _super);
        function FeaturefulElementDragging(containerEl) {
            var _this = _super.call(this, containerEl) || this;
            // options that can be directly set by caller
            // the caller can also set the PointerDragging's options as well
            _this.delay = null;
            _this.minDistance = 0;
            _this.touchScrollAllowed = true; // prevents drag from starting and blocks scrolling during drag
            _this.mirrorNeedsRevert = false;
            _this.isInteracting = false; // is the user validly moving the pointer? lasts until pointerup
            _this.isDragging = false; // is it INTENTFULLY dragging? lasts until after revert animation
            _this.isDelayEnded = false;
            _this.isDistanceSurpassed = false;
            _this.delayTimeoutId = null;
            _this.onPointerDown = function (ev) {
                if (!_this.isDragging) { // so new drag doesn't happen while revert animation is going
                    _this.isInteracting = true;
                    _this.isDelayEnded = false;
                    _this.isDistanceSurpassed = false;
                    core.preventSelection(document.body);
                    core.preventContextMenu(document.body);
                    // prevent links from being visited if there's an eventual drag.
                    // also prevents selection in older browsers (maybe?).
                    // not necessary for touch, besides, browser would complain about passiveness.
                    if (!ev.isTouch) {
                        ev.origEvent.preventDefault();
                    }
                    _this.emitter.trigger('pointerdown', ev);
                    if (!_this.pointer.shouldIgnoreMove) {
                        // actions related to initiating dragstart+dragmove+dragend...
                        _this.mirror.setIsVisible(false); // reset. caller must set-visible
                        _this.mirror.start(ev.subjectEl, ev.pageX, ev.pageY); // must happen on first pointer down
                        _this.startDelay(ev);
                        if (!_this.minDistance) {
                            _this.handleDistanceSurpassed(ev);
                        }
                    }
                }
            };
            _this.onPointerMove = function (ev) {
                if (_this.isInteracting) { // if false, still waiting for previous drag's revert
                    _this.emitter.trigger('pointermove', ev);
                    if (!_this.isDistanceSurpassed) {
                        var minDistance = _this.minDistance;
                        var distanceSq = void 0; // current distance from the origin, squared
                        var deltaX = ev.deltaX, deltaY = ev.deltaY;
                        distanceSq = deltaX * deltaX + deltaY * deltaY;
                        if (distanceSq >= minDistance * minDistance) { // use pythagorean theorem
                            _this.handleDistanceSurpassed(ev);
                        }
                    }
                    if (_this.isDragging) {
                        // a real pointer move? (not one simulated by scrolling)
                        if (ev.origEvent.type !== 'scroll') {
                            _this.mirror.handleMove(ev.pageX, ev.pageY);
                            _this.autoScroller.handleMove(ev.pageX, ev.pageY);
                        }
                        _this.emitter.trigger('dragmove', ev);
                    }
                }
            };
            _this.onPointerUp = function (ev) {
                if (_this.isInteracting) { // if false, still waiting for previous drag's revert
                    _this.isInteracting = false;
                    core.allowSelection(document.body);
                    core.allowContextMenu(document.body);
                    _this.emitter.trigger('pointerup', ev); // can potentially set mirrorNeedsRevert
                    if (_this.isDragging) {
                        _this.autoScroller.stop();
                        _this.tryStopDrag(ev); // which will stop the mirror
                    }
                    if (_this.delayTimeoutId) {
                        clearTimeout(_this.delayTimeoutId);
                        _this.delayTimeoutId = null;
                    }
                }
            };
            var pointer = _this.pointer = new PointerDragging(containerEl);
            pointer.emitter.on('pointerdown', _this.onPointerDown);
            pointer.emitter.on('pointermove', _this.onPointerMove);
            pointer.emitter.on('pointerup', _this.onPointerUp);
            _this.mirror = new ElementMirror();
            _this.autoScroller = new AutoScroller();
            return _this;
        }
        FeaturefulElementDragging.prototype.destroy = function () {
            this.pointer.destroy();
        };
        FeaturefulElementDragging.prototype.startDelay = function (ev) {
            var _this = this;
            if (typeof this.delay === 'number') {
                this.delayTimeoutId = setTimeout(function () {
                    _this.delayTimeoutId = null;
                    _this.handleDelayEnd(ev);
                }, this.delay); // not assignable to number!
            }
            else {
                this.handleDelayEnd(ev);
            }
        };
        FeaturefulElementDragging.prototype.handleDelayEnd = function (ev) {
            this.isDelayEnded = true;
            this.tryStartDrag(ev);
        };
        FeaturefulElementDragging.prototype.handleDistanceSurpassed = function (ev) {
            this.isDistanceSurpassed = true;
            this.tryStartDrag(ev);
        };
        FeaturefulElementDragging.prototype.tryStartDrag = function (ev) {
            if (this.isDelayEnded && this.isDistanceSurpassed) {
                if (!this.pointer.wasTouchScroll || this.touchScrollAllowed) {
                    this.isDragging = true;
                    this.mirrorNeedsRevert = false;
                    this.autoScroller.start(ev.pageX, ev.pageY);
                    this.emitter.trigger('dragstart', ev);
                    if (this.touchScrollAllowed === false) {
                        this.pointer.cancelTouchScroll();
                    }
                }
            }
        };
        FeaturefulElementDragging.prototype.tryStopDrag = function (ev) {
            // .stop() is ALWAYS asynchronous, which we NEED because we want all pointerup events
            // that come from the document to fire beforehand. much more convenient this way.
            this.mirror.stop(this.mirrorNeedsRevert, this.stopDrag.bind(this, ev) // bound with args
            );
        };
        FeaturefulElementDragging.prototype.stopDrag = function (ev) {
            this.isDragging = false;
            this.emitter.trigger('dragend', ev);
        };
        // fill in the implementations...
        FeaturefulElementDragging.prototype.setIgnoreMove = function (bool) {
            this.pointer.shouldIgnoreMove = bool;
        };
        FeaturefulElementDragging.prototype.setMirrorIsVisible = function (bool) {
            this.mirror.setIsVisible(bool);
        };
        FeaturefulElementDragging.prototype.setMirrorNeedsRevert = function (bool) {
            this.mirrorNeedsRevert = bool;
        };
        FeaturefulElementDragging.prototype.setAutoScrollEnabled = function (bool) {
            this.autoScroller.isEnabled = bool;
        };
        return FeaturefulElementDragging;
    }(core.ElementDragging));

    /*
    When this class is instantiated, it records the offset of an element (relative to the document topleft),
    and continues to monitor scrolling, updating the cached coordinates if it needs to.
    Does not access the DOM after instantiation, so highly performant.

    Also keeps track of all scrolling/overflow:hidden containers that are parents of the given element
    and an determine if a given point is inside the combined clipping rectangle.
    */
    var OffsetTracker = /** @class */ (function () {
        function OffsetTracker(el) {
            this.origRect = core.computeRect(el);
            // will work fine for divs that have overflow:hidden
            this.scrollCaches = core.getClippingParents(el).map(function (el) {
                return new ElementScrollGeomCache(el, true); // listen=true
            });
        }
        OffsetTracker.prototype.destroy = function () {
            for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                var scrollCache = _a[_i];
                scrollCache.destroy();
            }
        };
        OffsetTracker.prototype.computeLeft = function () {
            var left = this.origRect.left;
            for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                var scrollCache = _a[_i];
                left += scrollCache.origScrollLeft - scrollCache.getScrollLeft();
            }
            return left;
        };
        OffsetTracker.prototype.computeTop = function () {
            var top = this.origRect.top;
            for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                var scrollCache = _a[_i];
                top += scrollCache.origScrollTop - scrollCache.getScrollTop();
            }
            return top;
        };
        OffsetTracker.prototype.isWithinClipping = function (pageX, pageY) {
            var point = { left: pageX, top: pageY };
            for (var _i = 0, _a = this.scrollCaches; _i < _a.length; _i++) {
                var scrollCache = _a[_i];
                if (!isIgnoredClipping(scrollCache.getEventTarget()) &&
                    !core.pointInsideRect(point, scrollCache.clientRect)) {
                    return false;
                }
            }
            return true;
        };
        return OffsetTracker;
    }());
    // certain clipping containers should never constrain interactions, like <html> and <body>
    // https://github.com/fullcalendar/fullcalendar/issues/3615
    function isIgnoredClipping(node) {
        var tagName = node.tagName;
        return tagName === 'HTML' || tagName === 'BODY';
    }

    /*
    Tracks movement over multiple droppable areas (aka "hits")
    that exist in one or more DateComponents.
    Relies on an existing draggable.

    emits:
    - pointerdown
    - dragstart
    - hitchange - fires initially, even if not over a hit
    - pointerup
    - (hitchange - again, to null, if ended over a hit)
    - dragend
    */
    var HitDragging = /** @class */ (function () {
        function HitDragging(dragging, droppableStore) {
            var _this = this;
            // options that can be set by caller
            this.useSubjectCenter = false;
            this.requireInitial = true; // if doesn't start out on a hit, won't emit any events
            this.initialHit = null;
            this.movingHit = null;
            this.finalHit = null; // won't ever be populated if shouldIgnoreMove
            this.handlePointerDown = function (ev) {
                var dragging = _this.dragging;
                _this.initialHit = null;
                _this.movingHit = null;
                _this.finalHit = null;
                _this.prepareHits();
                _this.processFirstCoord(ev);
                if (_this.initialHit || !_this.requireInitial) {
                    dragging.setIgnoreMove(false);
                    _this.emitter.trigger('pointerdown', ev); // TODO: fire this before computing processFirstCoord, so listeners can cancel. this gets fired by almost every handler :(
                }
                else {
                    dragging.setIgnoreMove(true);
                }
            };
            this.handleDragStart = function (ev) {
                _this.emitter.trigger('dragstart', ev);
                _this.handleMove(ev, true); // force = fire even if initially null
            };
            this.handleDragMove = function (ev) {
                _this.emitter.trigger('dragmove', ev);
                _this.handleMove(ev);
            };
            this.handlePointerUp = function (ev) {
                _this.releaseHits();
                _this.emitter.trigger('pointerup', ev);
            };
            this.handleDragEnd = function (ev) {
                if (_this.movingHit) {
                    _this.emitter.trigger('hitupdate', null, true, ev);
                }
                _this.finalHit = _this.movingHit;
                _this.movingHit = null;
                _this.emitter.trigger('dragend', ev);
            };
            this.droppableStore = droppableStore;
            dragging.emitter.on('pointerdown', this.handlePointerDown);
            dragging.emitter.on('dragstart', this.handleDragStart);
            dragging.emitter.on('dragmove', this.handleDragMove);
            dragging.emitter.on('pointerup', this.handlePointerUp);
            dragging.emitter.on('dragend', this.handleDragEnd);
            this.dragging = dragging;
            this.emitter = new core.EmitterMixin();
        }
        // sets initialHit
        // sets coordAdjust
        HitDragging.prototype.processFirstCoord = function (ev) {
            var origPoint = { left: ev.pageX, top: ev.pageY };
            var adjustedPoint = origPoint;
            var subjectEl = ev.subjectEl;
            var subjectRect;
            if (subjectEl !== document) {
                subjectRect = core.computeRect(subjectEl);
                adjustedPoint = core.constrainPoint(adjustedPoint, subjectRect);
            }
            var initialHit = this.initialHit = this.queryHitForOffset(adjustedPoint.left, adjustedPoint.top);
            if (initialHit) {
                if (this.useSubjectCenter && subjectRect) {
                    var slicedSubjectRect = core.intersectRects(subjectRect, initialHit.rect);
                    if (slicedSubjectRect) {
                        adjustedPoint = core.getRectCenter(slicedSubjectRect);
                    }
                }
                this.coordAdjust = core.diffPoints(adjustedPoint, origPoint);
            }
            else {
                this.coordAdjust = { left: 0, top: 0 };
            }
        };
        HitDragging.prototype.handleMove = function (ev, forceHandle) {
            var hit = this.queryHitForOffset(ev.pageX + this.coordAdjust.left, ev.pageY + this.coordAdjust.top);
            if (forceHandle || !isHitsEqual(this.movingHit, hit)) {
                this.movingHit = hit;
                this.emitter.trigger('hitupdate', hit, false, ev);
            }
        };
        HitDragging.prototype.prepareHits = function () {
            this.offsetTrackers = core.mapHash(this.droppableStore, function (interactionSettings) {
                interactionSettings.component.buildPositionCaches();
                return new OffsetTracker(interactionSettings.el);
            });
        };
        HitDragging.prototype.releaseHits = function () {
            var offsetTrackers = this.offsetTrackers;
            for (var id in offsetTrackers) {
                offsetTrackers[id].destroy();
            }
            this.offsetTrackers = {};
        };
        HitDragging.prototype.queryHitForOffset = function (offsetLeft, offsetTop) {
            var _a = this, droppableStore = _a.droppableStore, offsetTrackers = _a.offsetTrackers;
            var bestHit = null;
            for (var id in droppableStore) {
                var component = droppableStore[id].component;
                var offsetTracker = offsetTrackers[id];
                if (offsetTracker.isWithinClipping(offsetLeft, offsetTop)) {
                    var originLeft = offsetTracker.computeLeft();
                    var originTop = offsetTracker.computeTop();
                    var positionLeft = offsetLeft - originLeft;
                    var positionTop = offsetTop - originTop;
                    var origRect = offsetTracker.origRect;
                    var width = origRect.right - origRect.left;
                    var height = origRect.bottom - origRect.top;
                    if (
                    // must be within the element's bounds
                    positionLeft >= 0 && positionLeft < width &&
                        positionTop >= 0 && positionTop < height) {
                        var hit = component.queryHit(positionLeft, positionTop, width, height);
                        if (hit &&
                            (
                            // make sure the hit is within activeRange, meaning it's not a deal cell
                            !component.props.dateProfile || // hack for DayTile
                                core.rangeContainsRange(component.props.dateProfile.activeRange, hit.dateSpan.range)) &&
                            (!bestHit || hit.layer > bestHit.layer)) {
                            // TODO: better way to re-orient rectangle
                            hit.rect.left += originLeft;
                            hit.rect.right += originLeft;
                            hit.rect.top += originTop;
                            hit.rect.bottom += originTop;
                            bestHit = hit;
                        }
                    }
                }
            }
            return bestHit;
        };
        return HitDragging;
    }());
    function isHitsEqual(hit0, hit1) {
        if (!hit0 && !hit1) {
            return true;
        }
        if (Boolean(hit0) !== Boolean(hit1)) {
            return false;
        }
        return core.isDateSpansEqual(hit0.dateSpan, hit1.dateSpan);
    }

    /*
    Monitors when the user clicks on a specific date/time of a component.
    A pointerdown+pointerup on the same "hit" constitutes a click.
    */
    var DateClicking = /** @class */ (function (_super) {
        __extends(DateClicking, _super);
        function DateClicking(settings) {
            var _this = _super.call(this, settings) || this;
            _this.handlePointerDown = function (ev) {
                var dragging = _this.dragging;
                // do this in pointerdown (not dragend) because DOM might be mutated by the time dragend is fired
                dragging.setIgnoreMove(!_this.component.isValidDateDownEl(dragging.pointer.downEl));
            };
            // won't even fire if moving was ignored
            _this.handleDragEnd = function (ev) {
                var component = _this.component;
                var _a = component.context, calendar = _a.calendar, view = _a.view;
                var pointer = _this.dragging.pointer;
                if (!pointer.wasTouchScroll) {
                    var _b = _this.hitDragging, initialHit = _b.initialHit, finalHit = _b.finalHit;
                    if (initialHit && finalHit && isHitsEqual(initialHit, finalHit)) {
                        calendar.triggerDateClick(initialHit.dateSpan, initialHit.dayEl, view, ev.origEvent);
                    }
                }
            };
            var component = settings.component;
            // we DO want to watch pointer moves because otherwise finalHit won't get populated
            _this.dragging = new FeaturefulElementDragging(component.el);
            _this.dragging.autoScroller.isEnabled = false;
            var hitDragging = _this.hitDragging = new HitDragging(_this.dragging, core.interactionSettingsToStore(settings));
            hitDragging.emitter.on('pointerdown', _this.handlePointerDown);
            hitDragging.emitter.on('dragend', _this.handleDragEnd);
            return _this;
        }
        DateClicking.prototype.destroy = function () {
            this.dragging.destroy();
        };
        return DateClicking;
    }(core.Interaction));

    /*
    Tracks when the user selects a portion of time of a component,
    constituted by a drag over date cells, with a possible delay at the beginning of the drag.
    */
    var DateSelecting = /** @class */ (function (_super) {
        __extends(DateSelecting, _super);
        function DateSelecting(settings) {
            var _this = _super.call(this, settings) || this;
            _this.dragSelection = null;
            _this.handlePointerDown = function (ev) {
                var _a = _this, component = _a.component, dragging = _a.dragging;
                var options = component.context.options;
                var canSelect = options.selectable &&
                    component.isValidDateDownEl(ev.origEvent.target);
                // don't bother to watch expensive moves if component won't do selection
                dragging.setIgnoreMove(!canSelect);
                // if touch, require user to hold down
                dragging.delay = ev.isTouch ? getComponentTouchDelay(component) : null;
            };
            _this.handleDragStart = function (ev) {
                _this.component.context.calendar.unselect(ev); // unselect previous selections
            };
            _this.handleHitUpdate = function (hit, isFinal) {
                var calendar = _this.component.context.calendar;
                var dragSelection = null;
                var isInvalid = false;
                if (hit) {
                    dragSelection = joinHitsIntoSelection(_this.hitDragging.initialHit, hit, calendar.pluginSystem.hooks.dateSelectionTransformers);
                    if (!dragSelection || !_this.component.isDateSelectionValid(dragSelection)) {
                        isInvalid = true;
                        dragSelection = null;
                    }
                }
                if (dragSelection) {
                    calendar.dispatch({ type: 'SELECT_DATES', selection: dragSelection });
                }
                else if (!isFinal) { // only unselect if moved away while dragging
                    calendar.dispatch({ type: 'UNSELECT_DATES' });
                }
                if (!isInvalid) {
                    core.enableCursor();
                }
                else {
                    core.disableCursor();
                }
                if (!isFinal) {
                    _this.dragSelection = dragSelection; // only clear if moved away from all hits while dragging
                }
            };
            _this.handlePointerUp = function (pev) {
                if (_this.dragSelection) {
                    // selection is already rendered, so just need to report selection
                    _this.component.context.calendar.triggerDateSelect(_this.dragSelection, pev);
                    _this.dragSelection = null;
                }
            };
            var component = settings.component;
            var options = component.context.options;
            var dragging = _this.dragging = new FeaturefulElementDragging(component.el);
            dragging.touchScrollAllowed = false;
            dragging.minDistance = options.selectMinDistance || 0;
            dragging.autoScroller.isEnabled = options.dragScroll;
            var hitDragging = _this.hitDragging = new HitDragging(_this.dragging, core.interactionSettingsToStore(settings));
            hitDragging.emitter.on('pointerdown', _this.handlePointerDown);
            hitDragging.emitter.on('dragstart', _this.handleDragStart);
            hitDragging.emitter.on('hitupdate', _this.handleHitUpdate);
            hitDragging.emitter.on('pointerup', _this.handlePointerUp);
            return _this;
        }
        DateSelecting.prototype.destroy = function () {
            this.dragging.destroy();
        };
        return DateSelecting;
    }(core.Interaction));
    function getComponentTouchDelay(component) {
        var options = component.context.options;
        var delay = options.selectLongPressDelay;
        if (delay == null) {
            delay = options.longPressDelay;
        }
        return delay;
    }
    function joinHitsIntoSelection(hit0, hit1, dateSelectionTransformers) {
        var dateSpan0 = hit0.dateSpan;
        var dateSpan1 = hit1.dateSpan;
        var ms = [
            dateSpan0.range.start,
            dateSpan0.range.end,
            dateSpan1.range.start,
            dateSpan1.range.end
        ];
        ms.sort(core.compareNumbers);
        var props = {};
        for (var _i = 0, dateSelectionTransformers_1 = dateSelectionTransformers; _i < dateSelectionTransformers_1.length; _i++) {
            var transformer = dateSelectionTransformers_1[_i];
            var res = transformer(hit0, hit1);
            if (res === false) {
                return null;
            }
            else if (res) {
                __assign(props, res);
            }
        }
        props.range = { start: ms[0], end: ms[3] };
        props.allDay = dateSpan0.allDay;
        return props;
    }

    var EventDragging = /** @class */ (function (_super) {
        __extends(EventDragging, _super);
        function EventDragging(settings) {
            var _this = _super.call(this, settings) || this;
            // internal state
            _this.subjectSeg = null; // the seg being selected/dragged
            _this.isDragging = false;
            _this.eventRange = null;
            _this.relevantEvents = null; // the events being dragged
            _this.receivingCalendar = null;
            _this.validMutation = null;
            _this.mutatedRelevantEvents = null;
            _this.handlePointerDown = function (ev) {
                var origTarget = ev.origEvent.target;
                var _a = _this, component = _a.component, dragging = _a.dragging;
                var mirror = dragging.mirror;
                var options = component.context.options;
                var initialCalendar = component.context.calendar;
                var subjectSeg = _this.subjectSeg = core.getElSeg(ev.subjectEl);
                var eventRange = _this.eventRange = subjectSeg.eventRange;
                var eventInstanceId = eventRange.instance.instanceId;
                _this.relevantEvents = core.getRelevantEvents(initialCalendar.state.eventStore, eventInstanceId);
                dragging.minDistance = ev.isTouch ? 0 : options.eventDragMinDistance;
                dragging.delay =
                    // only do a touch delay if touch and this event hasn't been selected yet
                    (ev.isTouch && eventInstanceId !== component.props.eventSelection) ?
                        getComponentTouchDelay$1(component) :
                        null;
                mirror.parentNode = initialCalendar.el;
                mirror.revertDuration = options.dragRevertDuration;
                var isValid = component.isValidSegDownEl(origTarget) &&
                    !core.elementClosest(origTarget, '.fc-resizer'); // NOT on a resizer
                dragging.setIgnoreMove(!isValid);
                // disable dragging for elements that are resizable (ie, selectable)
                // but are not draggable
                _this.isDragging = isValid &&
                    ev.subjectEl.classList.contains('fc-draggable');
            };
            _this.handleDragStart = function (ev) {
                var context = _this.component.context;
                var initialCalendar = context.calendar;
                var eventRange = _this.eventRange;
                var eventInstanceId = eventRange.instance.instanceId;
                if (ev.isTouch) {
                    // need to select a different event?
                    if (eventInstanceId !== _this.component.props.eventSelection) {
                        initialCalendar.dispatch({ type: 'SELECT_EVENT', eventInstanceId: eventInstanceId });
                    }
                }
                else {
                    // if now using mouse, but was previous touch interaction, clear selected event
                    initialCalendar.dispatch({ type: 'UNSELECT_EVENT' });
                }
                if (_this.isDragging) {
                    initialCalendar.unselect(ev); // unselect *date* selection
                    initialCalendar.publiclyTrigger('eventDragStart', [
                        {
                            el: _this.subjectSeg.el,
                            event: new core.EventApi(initialCalendar, eventRange.def, eventRange.instance),
                            jsEvent: ev.origEvent,
                            view: context.view
                        }
                    ]);
                }
            };
            _this.handleHitUpdate = function (hit, isFinal) {
                if (!_this.isDragging) {
                    return;
                }
                var relevantEvents = _this.relevantEvents;
                var initialHit = _this.hitDragging.initialHit;
                var initialCalendar = _this.component.context.calendar;
                // states based on new hit
                var receivingCalendar = null;
                var mutation = null;
                var mutatedRelevantEvents = null;
                var isInvalid = false;
                var interaction = {
                    affectedEvents: relevantEvents,
                    mutatedEvents: core.createEmptyEventStore(),
                    isEvent: true,
                    origSeg: _this.subjectSeg
                };
                if (hit) {
                    var receivingComponent = hit.component;
                    receivingCalendar = receivingComponent.context.calendar;
                    var receivingOptions = receivingComponent.context.options;
                    if (initialCalendar === receivingCalendar ||
                        receivingOptions.editable && receivingOptions.droppable) {
                        mutation = computeEventMutation(initialHit, hit, receivingCalendar.pluginSystem.hooks.eventDragMutationMassagers);
                        if (mutation) {
                            mutatedRelevantEvents = core.applyMutationToEventStore(relevantEvents, receivingCalendar.eventUiBases, mutation, receivingCalendar);
                            interaction.mutatedEvents = mutatedRelevantEvents;
                            if (!receivingComponent.isInteractionValid(interaction)) {
                                isInvalid = true;
                                mutation = null;
                                mutatedRelevantEvents = null;
                                interaction.mutatedEvents = core.createEmptyEventStore();
                            }
                        }
                    }
                    else {
                        receivingCalendar = null;
                    }
                }
                _this.displayDrag(receivingCalendar, interaction);
                if (!isInvalid) {
                    core.enableCursor();
                }
                else {
                    core.disableCursor();
                }
                if (!isFinal) {
                    if (initialCalendar === receivingCalendar && // TODO: write test for this
                        isHitsEqual(initialHit, hit)) {
                        mutation = null;
                    }
                    _this.dragging.setMirrorNeedsRevert(!mutation);
                    // render the mirror if no already-rendered mirror
                    // TODO: wish we could somehow wait for dispatch to guarantee render
                    _this.dragging.setMirrorIsVisible(!hit || !document.querySelector('.fc-mirror'));
                    // assign states based on new hit
                    _this.receivingCalendar = receivingCalendar;
                    _this.validMutation = mutation;
                    _this.mutatedRelevantEvents = mutatedRelevantEvents;
                }
            };
            _this.handlePointerUp = function () {
                if (!_this.isDragging) {
                    _this.cleanup(); // because handleDragEnd won't fire
                }
            };
            _this.handleDragEnd = function (ev) {
                if (_this.isDragging) {
                    var context = _this.component.context;
                    var initialCalendar_1 = context.calendar;
                    var initialView = context.view;
                    var _a = _this, receivingCalendar = _a.receivingCalendar, validMutation = _a.validMutation;
                    var eventDef = _this.eventRange.def;
                    var eventInstance = _this.eventRange.instance;
                    var eventApi = new core.EventApi(initialCalendar_1, eventDef, eventInstance);
                    var relevantEvents_1 = _this.relevantEvents;
                    var mutatedRelevantEvents = _this.mutatedRelevantEvents;
                    var finalHit = _this.hitDragging.finalHit;
                    _this.clearDrag(); // must happen after revert animation
                    initialCalendar_1.publiclyTrigger('eventDragStop', [
                        {
                            el: _this.subjectSeg.el,
                            event: eventApi,
                            jsEvent: ev.origEvent,
                            view: initialView
                        }
                    ]);
                    if (validMutation) {
                        // dropped within same calendar
                        if (receivingCalendar === initialCalendar_1) {
                            initialCalendar_1.dispatch({
                                type: 'MERGE_EVENTS',
                                eventStore: mutatedRelevantEvents
                            });
                            var transformed = {};
                            for (var _i = 0, _b = initialCalendar_1.pluginSystem.hooks.eventDropTransformers; _i < _b.length; _i++) {
                                var transformer = _b[_i];
                                __assign(transformed, transformer(validMutation, initialCalendar_1));
                            }
                            var eventDropArg = __assign({}, transformed, { el: ev.subjectEl, delta: validMutation.datesDelta, oldEvent: eventApi, event: new core.EventApi(// the data AFTER the mutation
                                initialCalendar_1, mutatedRelevantEvents.defs[eventDef.defId], eventInstance ? mutatedRelevantEvents.instances[eventInstance.instanceId] : null), revert: function () {
                                    initialCalendar_1.dispatch({
                                        type: 'MERGE_EVENTS',
                                        eventStore: relevantEvents_1
                                    });
                                }, jsEvent: ev.origEvent, view: initialView });
                            initialCalendar_1.publiclyTrigger('eventDrop', [eventDropArg]);
                            // dropped in different calendar
                        }
                        else if (receivingCalendar) {
                            initialCalendar_1.publiclyTrigger('eventLeave', [
                                {
                                    draggedEl: ev.subjectEl,
                                    event: eventApi,
                                    view: initialView
                                }
                            ]);
                            initialCalendar_1.dispatch({
                                type: 'REMOVE_EVENT_INSTANCES',
                                instances: _this.mutatedRelevantEvents.instances
                            });
                            receivingCalendar.dispatch({
                                type: 'MERGE_EVENTS',
                                eventStore: _this.mutatedRelevantEvents
                            });
                            if (ev.isTouch) {
                                receivingCalendar.dispatch({
                                    type: 'SELECT_EVENT',
                                    eventInstanceId: eventInstance.instanceId
                                });
                            }
                            var dropArg = __assign({}, receivingCalendar.buildDatePointApi(finalHit.dateSpan), { draggedEl: ev.subjectEl, jsEvent: ev.origEvent, view: finalHit.component // should this be finalHit.component.view? See #4644
                             });
                            receivingCalendar.publiclyTrigger('drop', [dropArg]);
                            receivingCalendar.publiclyTrigger('eventReceive', [
                                {
                                    draggedEl: ev.subjectEl,
                                    event: new core.EventApi(// the data AFTER the mutation
                                    receivingCalendar, mutatedRelevantEvents.defs[eventDef.defId], mutatedRelevantEvents.instances[eventInstance.instanceId]),
                                    view: finalHit.component // should this be finalHit.component.view? See #4644
                                }
                            ]);
                        }
                    }
                    else {
                        initialCalendar_1.publiclyTrigger('_noEventDrop');
                    }
                }
                _this.cleanup();
            };
            var component = _this.component;
            var options = component.context.options;
            var dragging = _this.dragging = new FeaturefulElementDragging(component.el);
            dragging.pointer.selector = EventDragging.SELECTOR;
            dragging.touchScrollAllowed = false;
            dragging.autoScroller.isEnabled = options.dragScroll;
            var hitDragging = _this.hitDragging = new HitDragging(_this.dragging, core.interactionSettingsStore);
            hitDragging.useSubjectCenter = settings.useEventCenter;
            hitDragging.emitter.on('pointerdown', _this.handlePointerDown);
            hitDragging.emitter.on('dragstart', _this.handleDragStart);
            hitDragging.emitter.on('hitupdate', _this.handleHitUpdate);
            hitDragging.emitter.on('pointerup', _this.handlePointerUp);
            hitDragging.emitter.on('dragend', _this.handleDragEnd);
            return _this;
        }
        EventDragging.prototype.destroy = function () {
            this.dragging.destroy();
        };
        // render a drag state on the next receivingCalendar
        EventDragging.prototype.displayDrag = function (nextCalendar, state) {
            var initialCalendar = this.component.context.calendar;
            var prevCalendar = this.receivingCalendar;
            // does the previous calendar need to be cleared?
            if (prevCalendar && prevCalendar !== nextCalendar) {
                // does the initial calendar need to be cleared?
                // if so, don't clear all the way. we still need to to hide the affectedEvents
                if (prevCalendar === initialCalendar) {
                    prevCalendar.dispatch({
                        type: 'SET_EVENT_DRAG',
                        state: {
                            affectedEvents: state.affectedEvents,
                            mutatedEvents: core.createEmptyEventStore(),
                            isEvent: true,
                            origSeg: state.origSeg
                        }
                    });
                    // completely clear the old calendar if it wasn't the initial
                }
                else {
                    prevCalendar.dispatch({ type: 'UNSET_EVENT_DRAG' });
                }
            }
            if (nextCalendar) {
                nextCalendar.dispatch({ type: 'SET_EVENT_DRAG', state: state });
            }
        };
        EventDragging.prototype.clearDrag = function () {
            var initialCalendar = this.component.context.calendar;
            var receivingCalendar = this.receivingCalendar;
            if (receivingCalendar) {
                receivingCalendar.dispatch({ type: 'UNSET_EVENT_DRAG' });
            }
            // the initial calendar might have an dummy drag state from displayDrag
            if (initialCalendar !== receivingCalendar) {
                initialCalendar.dispatch({ type: 'UNSET_EVENT_DRAG' });
            }
        };
        EventDragging.prototype.cleanup = function () {
            this.subjectSeg = null;
            this.isDragging = false;
            this.eventRange = null;
            this.relevantEvents = null;
            this.receivingCalendar = null;
            this.validMutation = null;
            this.mutatedRelevantEvents = null;
        };
        EventDragging.SELECTOR = '.fc-draggable, .fc-resizable'; // TODO: test this in IE11
        return EventDragging;
    }(core.Interaction));
    function computeEventMutation(hit0, hit1, massagers) {
        var dateSpan0 = hit0.dateSpan;
        var dateSpan1 = hit1.dateSpan;
        var date0 = dateSpan0.range.start;
        var date1 = dateSpan1.range.start;
        var standardProps = {};
        if (dateSpan0.allDay !== dateSpan1.allDay) {
            standardProps.allDay = dateSpan1.allDay;
            standardProps.hasEnd = hit1.component.context.options.allDayMaintainDuration;
            if (dateSpan1.allDay) {
                // means date1 is already start-of-day,
                // but date0 needs to be converted
                date0 = core.startOfDay(date0);
            }
        }
        var delta = core.diffDates(date0, date1, hit0.component.context.dateEnv, hit0.component === hit1.component ?
            hit0.component.largeUnit :
            null);
        if (delta.milliseconds) { // has hours/minutes/seconds
            standardProps.allDay = false;
        }
        var mutation = {
            datesDelta: delta,
            standardProps: standardProps
        };
        for (var _i = 0, massagers_1 = massagers; _i < massagers_1.length; _i++) {
            var massager = massagers_1[_i];
            massager(mutation, hit0, hit1);
        }
        return mutation;
    }
    function getComponentTouchDelay$1(component) {
        var options = component.context.options;
        var delay = options.eventLongPressDelay;
        if (delay == null) {
            delay = options.longPressDelay;
        }
        return delay;
    }

    var EventDragging$1 = /** @class */ (function (_super) {
        __extends(EventDragging, _super);
        function EventDragging(settings) {
            var _this = _super.call(this, settings) || this;
            // internal state
            _this.draggingSeg = null; // TODO: rename to resizingSeg? subjectSeg?
            _this.eventRange = null;
            _this.relevantEvents = null;
            _this.validMutation = null;
            _this.mutatedRelevantEvents = null;
            _this.handlePointerDown = function (ev) {
                var component = _this.component;
                var seg = _this.querySeg(ev);
                var eventRange = _this.eventRange = seg.eventRange;
                _this.dragging.minDistance = component.context.options.eventDragMinDistance;
                // if touch, need to be working with a selected event
                _this.dragging.setIgnoreMove(!_this.component.isValidSegDownEl(ev.origEvent.target) ||
                    (ev.isTouch && _this.component.props.eventSelection !== eventRange.instance.instanceId));
            };
            _this.handleDragStart = function (ev) {
                var _a = _this.component.context, calendar = _a.calendar, view = _a.view;
                var eventRange = _this.eventRange;
                _this.relevantEvents = core.getRelevantEvents(calendar.state.eventStore, _this.eventRange.instance.instanceId);
                _this.draggingSeg = _this.querySeg(ev);
                calendar.unselect();
                calendar.publiclyTrigger('eventResizeStart', [
                    {
                        el: _this.draggingSeg.el,
                        event: new core.EventApi(calendar, eventRange.def, eventRange.instance),
                        jsEvent: ev.origEvent,
                        view: view
                    }
                ]);
            };
            _this.handleHitUpdate = function (hit, isFinal, ev) {
                var calendar = _this.component.context.calendar;
                var relevantEvents = _this.relevantEvents;
                var initialHit = _this.hitDragging.initialHit;
                var eventInstance = _this.eventRange.instance;
                var mutation = null;
                var mutatedRelevantEvents = null;
                var isInvalid = false;
                var interaction = {
                    affectedEvents: relevantEvents,
                    mutatedEvents: core.createEmptyEventStore(),
                    isEvent: true,
                    origSeg: _this.draggingSeg
                };
                if (hit) {
                    mutation = computeMutation(initialHit, hit, ev.subjectEl.classList.contains('fc-start-resizer'), eventInstance.range, calendar.pluginSystem.hooks.eventResizeJoinTransforms);
                }
                if (mutation) {
                    mutatedRelevantEvents = core.applyMutationToEventStore(relevantEvents, calendar.eventUiBases, mutation, calendar);
                    interaction.mutatedEvents = mutatedRelevantEvents;
                    if (!_this.component.isInteractionValid(interaction)) {
                        isInvalid = true;
                        mutation = null;
                        mutatedRelevantEvents = null;
                        interaction.mutatedEvents = null;
                    }
                }
                if (mutatedRelevantEvents) {
                    calendar.dispatch({
                        type: 'SET_EVENT_RESIZE',
                        state: interaction
                    });
                }
                else {
                    calendar.dispatch({ type: 'UNSET_EVENT_RESIZE' });
                }
                if (!isInvalid) {
                    core.enableCursor();
                }
                else {
                    core.disableCursor();
                }
                if (!isFinal) {
                    if (mutation && isHitsEqual(initialHit, hit)) {
                        mutation = null;
                    }
                    _this.validMutation = mutation;
                    _this.mutatedRelevantEvents = mutatedRelevantEvents;
                }
            };
            _this.handleDragEnd = function (ev) {
                var _a = _this.component.context, calendar = _a.calendar, view = _a.view;
                var eventDef = _this.eventRange.def;
                var eventInstance = _this.eventRange.instance;
                var eventApi = new core.EventApi(calendar, eventDef, eventInstance);
                var relevantEvents = _this.relevantEvents;
                var mutatedRelevantEvents = _this.mutatedRelevantEvents;
                calendar.publiclyTrigger('eventResizeStop', [
                    {
                        el: _this.draggingSeg.el,
                        event: eventApi,
                        jsEvent: ev.origEvent,
                        view: view
                    }
                ]);
                if (_this.validMutation) {
                    calendar.dispatch({
                        type: 'MERGE_EVENTS',
                        eventStore: mutatedRelevantEvents
                    });
                    calendar.publiclyTrigger('eventResize', [
                        {
                            el: _this.draggingSeg.el,
                            startDelta: _this.validMutation.startDelta || core.createDuration(0),
                            endDelta: _this.validMutation.endDelta || core.createDuration(0),
                            prevEvent: eventApi,
                            event: new core.EventApi(// the data AFTER the mutation
                            calendar, mutatedRelevantEvents.defs[eventDef.defId], eventInstance ? mutatedRelevantEvents.instances[eventInstance.instanceId] : null),
                            revert: function () {
                                calendar.dispatch({
                                    type: 'MERGE_EVENTS',
                                    eventStore: relevantEvents
                                });
                            },
                            jsEvent: ev.origEvent,
                            view: view
                        }
                    ]);
                }
                else {
                    calendar.publiclyTrigger('_noEventResize');
                }
                // reset all internal state
                _this.draggingSeg = null;
                _this.relevantEvents = null;
                _this.validMutation = null;
                // okay to keep eventInstance around. useful to set it in handlePointerDown
            };
            var component = settings.component;
            var dragging = _this.dragging = new FeaturefulElementDragging(component.el);
            dragging.pointer.selector = '.fc-resizer';
            dragging.touchScrollAllowed = false;
            dragging.autoScroller.isEnabled = component.context.options.dragScroll;
            var hitDragging = _this.hitDragging = new HitDragging(_this.dragging, core.interactionSettingsToStore(settings));
            hitDragging.emitter.on('pointerdown', _this.handlePointerDown);
            hitDragging.emitter.on('dragstart', _this.handleDragStart);
            hitDragging.emitter.on('hitupdate', _this.handleHitUpdate);
            hitDragging.emitter.on('dragend', _this.handleDragEnd);
            return _this;
        }
        EventDragging.prototype.destroy = function () {
            this.dragging.destroy();
        };
        EventDragging.prototype.querySeg = function (ev) {
            return core.getElSeg(core.elementClosest(ev.subjectEl, this.component.fgSegSelector));
        };
        return EventDragging;
    }(core.Interaction));
    function computeMutation(hit0, hit1, isFromStart, instanceRange, transforms) {
        var dateEnv = hit0.component.context.dateEnv;
        var date0 = hit0.dateSpan.range.start;
        var date1 = hit1.dateSpan.range.start;
        var delta = core.diffDates(date0, date1, dateEnv, hit0.component.largeUnit);
        var props = {};
        for (var _i = 0, transforms_1 = transforms; _i < transforms_1.length; _i++) {
            var transform = transforms_1[_i];
            var res = transform(hit0, hit1);
            if (res === false) {
                return null;
            }
            else if (res) {
                __assign(props, res);
            }
        }
        if (isFromStart) {
            if (dateEnv.add(instanceRange.start, delta) < instanceRange.end) {
                props.startDelta = delta;
                return props;
            }
        }
        else {
            if (dateEnv.add(instanceRange.end, delta) > instanceRange.start) {
                props.endDelta = delta;
                return props;
            }
        }
        return null;
    }

    var UnselectAuto = /** @class */ (function () {
        function UnselectAuto(calendar) {
            var _this = this;
            this.isRecentPointerDateSelect = false; // wish we could use a selector to detect date selection, but uses hit system
            this.onSelect = function (selectInfo) {
                if (selectInfo.jsEvent) {
                    _this.isRecentPointerDateSelect = true;
                }
            };
            this.onDocumentPointerUp = function (pev) {
                var _a = _this, calendar = _a.calendar, documentPointer = _a.documentPointer;
                var state = calendar.state;
                // touch-scrolling should never unfocus any type of selection
                if (!documentPointer.wasTouchScroll) {
                    if (state.dateSelection && // an existing date selection?
                        !_this.isRecentPointerDateSelect // a new pointer-initiated date selection since last onDocumentPointerUp?
                    ) {
                        var unselectAuto = calendar.viewOpt('unselectAuto');
                        var unselectCancel = calendar.viewOpt('unselectCancel');
                        if (unselectAuto && (!unselectAuto || !core.elementClosest(documentPointer.downEl, unselectCancel))) {
                            calendar.unselect(pev);
                        }
                    }
                    if (state.eventSelection && // an existing event selected?
                        !core.elementClosest(documentPointer.downEl, EventDragging.SELECTOR) // interaction DIDN'T start on an event
                    ) {
                        calendar.dispatch({ type: 'UNSELECT_EVENT' });
                    }
                }
                _this.isRecentPointerDateSelect = false;
            };
            this.calendar = calendar;
            var documentPointer = this.documentPointer = new PointerDragging(document);
            documentPointer.shouldIgnoreMove = true;
            documentPointer.shouldWatchScroll = false;
            documentPointer.emitter.on('pointerup', this.onDocumentPointerUp);
            /*
            TODO: better way to know about whether there was a selection with the pointer
            */
            calendar.on('select', this.onSelect);
        }
        UnselectAuto.prototype.destroy = function () {
            this.calendar.off('select', this.onSelect);
            this.documentPointer.destroy();
        };
        return UnselectAuto;
    }());

    /*
    Given an already instantiated draggable object for one-or-more elements,
    Interprets any dragging as an attempt to drag an events that lives outside
    of a calendar onto a calendar.
    */
    var ExternalElementDragging = /** @class */ (function () {
        function ExternalElementDragging(dragging, suppliedDragMeta) {
            var _this = this;
            this.receivingCalendar = null;
            this.droppableEvent = null; // will exist for all drags, even if create:false
            this.suppliedDragMeta = null;
            this.dragMeta = null;
            this.handleDragStart = function (ev) {
                _this.dragMeta = _this.buildDragMeta(ev.subjectEl);
            };
            this.handleHitUpdate = function (hit, isFinal, ev) {
                var dragging = _this.hitDragging.dragging;
                var receivingCalendar = null;
                var droppableEvent = null;
                var isInvalid = false;
                var interaction = {
                    affectedEvents: core.createEmptyEventStore(),
                    mutatedEvents: core.createEmptyEventStore(),
                    isEvent: _this.dragMeta.create,
                    origSeg: null
                };
                if (hit) {
                    receivingCalendar = hit.component.context.calendar;
                    if (_this.canDropElOnCalendar(ev.subjectEl, receivingCalendar)) {
                        droppableEvent = computeEventForDateSpan(hit.dateSpan, _this.dragMeta, receivingCalendar);
                        interaction.mutatedEvents = core.eventTupleToStore(droppableEvent);
                        isInvalid = !core.isInteractionValid(interaction, receivingCalendar);
                        if (isInvalid) {
                            interaction.mutatedEvents = core.createEmptyEventStore();
                            droppableEvent = null;
                        }
                    }
                }
                _this.displayDrag(receivingCalendar, interaction);
                // show mirror if no already-rendered mirror element OR if we are shutting down the mirror (?)
                // TODO: wish we could somehow wait for dispatch to guarantee render
                dragging.setMirrorIsVisible(isFinal || !droppableEvent || !document.querySelector('.fc-mirror'));
                if (!isInvalid) {
                    core.enableCursor();
                }
                else {
                    core.disableCursor();
                }
                if (!isFinal) {
                    dragging.setMirrorNeedsRevert(!droppableEvent);
                    _this.receivingCalendar = receivingCalendar;
                    _this.droppableEvent = droppableEvent;
                }
            };
            this.handleDragEnd = function (pev) {
                var _a = _this, receivingCalendar = _a.receivingCalendar, droppableEvent = _a.droppableEvent;
                _this.clearDrag();
                if (receivingCalendar && droppableEvent) {
                    var finalHit = _this.hitDragging.finalHit;
                    var finalView = finalHit.component.context.view;
                    var dragMeta = _this.dragMeta;
                    var arg = __assign({}, receivingCalendar.buildDatePointApi(finalHit.dateSpan), { draggedEl: pev.subjectEl, jsEvent: pev.origEvent, view: finalView });
                    receivingCalendar.publiclyTrigger('drop', [arg]);
                    if (dragMeta.create) {
                        receivingCalendar.dispatch({
                            type: 'MERGE_EVENTS',
                            eventStore: core.eventTupleToStore(droppableEvent)
                        });
                        if (pev.isTouch) {
                            receivingCalendar.dispatch({
                                type: 'SELECT_EVENT',
                                eventInstanceId: droppableEvent.instance.instanceId
                            });
                        }
                        // signal that an external event landed
                        receivingCalendar.publiclyTrigger('eventReceive', [
                            {
                                draggedEl: pev.subjectEl,
                                event: new core.EventApi(receivingCalendar, droppableEvent.def, droppableEvent.instance),
                                view: finalView
                            }
                        ]);
                    }
                }
                _this.receivingCalendar = null;
                _this.droppableEvent = null;
            };
            var hitDragging = this.hitDragging = new HitDragging(dragging, core.interactionSettingsStore);
            hitDragging.requireInitial = false; // will start outside of a component
            hitDragging.emitter.on('dragstart', this.handleDragStart);
            hitDragging.emitter.on('hitupdate', this.handleHitUpdate);
            hitDragging.emitter.on('dragend', this.handleDragEnd);
            this.suppliedDragMeta = suppliedDragMeta;
        }
        ExternalElementDragging.prototype.buildDragMeta = function (subjectEl) {
            if (typeof this.suppliedDragMeta === 'object') {
                return core.parseDragMeta(this.suppliedDragMeta);
            }
            else if (typeof this.suppliedDragMeta === 'function') {
                return core.parseDragMeta(this.suppliedDragMeta(subjectEl));
            }
            else {
                return getDragMetaFromEl(subjectEl);
            }
        };
        ExternalElementDragging.prototype.displayDrag = function (nextCalendar, state) {
            var prevCalendar = this.receivingCalendar;
            if (prevCalendar && prevCalendar !== nextCalendar) {
                prevCalendar.dispatch({ type: 'UNSET_EVENT_DRAG' });
            }
            if (nextCalendar) {
                nextCalendar.dispatch({ type: 'SET_EVENT_DRAG', state: state });
            }
        };
        ExternalElementDragging.prototype.clearDrag = function () {
            if (this.receivingCalendar) {
                this.receivingCalendar.dispatch({ type: 'UNSET_EVENT_DRAG' });
            }
        };
        ExternalElementDragging.prototype.canDropElOnCalendar = function (el, receivingCalendar) {
            var dropAccept = receivingCalendar.opt('dropAccept');
            if (typeof dropAccept === 'function') {
                return dropAccept(el);
            }
            else if (typeof dropAccept === 'string' && dropAccept) {
                return Boolean(core.elementMatches(el, dropAccept));
            }
            return true;
        };
        return ExternalElementDragging;
    }());
    // Utils for computing event store from the DragMeta
    // ----------------------------------------------------------------------------------------------------
    function computeEventForDateSpan(dateSpan, dragMeta, calendar) {
        var defProps = __assign({}, dragMeta.leftoverProps);
        for (var _i = 0, _a = calendar.pluginSystem.hooks.externalDefTransforms; _i < _a.length; _i++) {
            var transform = _a[_i];
            __assign(defProps, transform(dateSpan, dragMeta));
        }
        var def = core.parseEventDef(defProps, dragMeta.sourceId, dateSpan.allDay, calendar.opt('forceEventDuration') || Boolean(dragMeta.duration), // hasEnd
        calendar);
        var start = dateSpan.range.start;
        // only rely on time info if drop zone is all-day,
        // otherwise, we already know the time
        if (dateSpan.allDay && dragMeta.startTime) {
            start = calendar.dateEnv.add(start, dragMeta.startTime);
        }
        var end = dragMeta.duration ?
            calendar.dateEnv.add(start, dragMeta.duration) :
            calendar.getDefaultEventEnd(dateSpan.allDay, start);
        var instance = core.createEventInstance(def.defId, { start: start, end: end });
        return { def: def, instance: instance };
    }
    // Utils for extracting data from element
    // ----------------------------------------------------------------------------------------------------
    function getDragMetaFromEl(el) {
        var str = getEmbeddedElData(el, 'event');
        var obj = str ?
            JSON.parse(str) :
            { create: false }; // if no embedded data, assume no event creation
        return core.parseDragMeta(obj);
    }
    core.config.dataAttrPrefix = '';
    function getEmbeddedElData(el, name) {
        var prefix = core.config.dataAttrPrefix;
        var prefixedName = (prefix ? prefix + '-' : '') + name;
        return el.getAttribute('data-' + prefixedName) || '';
    }

    /*
    Makes an element (that is *external* to any calendar) draggable.
    Can pass in data that determines how an event will be created when dropped onto a calendar.
    Leverages FullCalendar's internal drag-n-drop functionality WITHOUT a third-party drag system.
    */
    var ExternalDraggable = /** @class */ (function () {
        function ExternalDraggable(el, settings) {
            var _this = this;
            if (settings === void 0) { settings = {}; }
            this.handlePointerDown = function (ev) {
                var dragging = _this.dragging;
                var _a = _this.settings, minDistance = _a.minDistance, longPressDelay = _a.longPressDelay;
                dragging.minDistance =
                    minDistance != null ?
                        minDistance :
                        (ev.isTouch ? 0 : core.globalDefaults.eventDragMinDistance);
                dragging.delay =
                    ev.isTouch ? // TODO: eventually read eventLongPressDelay instead vvv
                        (longPressDelay != null ? longPressDelay : core.globalDefaults.longPressDelay) :
                        0;
            };
            this.handleDragStart = function (ev) {
                if (ev.isTouch &&
                    _this.dragging.delay &&
                    ev.subjectEl.classList.contains('fc-event')) {
                    _this.dragging.mirror.getMirrorEl().classList.add('fc-selected');
                }
            };
            this.settings = settings;
            var dragging = this.dragging = new FeaturefulElementDragging(el);
            dragging.touchScrollAllowed = false;
            if (settings.itemSelector != null) {
                dragging.pointer.selector = settings.itemSelector;
            }
            if (settings.appendTo != null) {
                dragging.mirror.parentNode = settings.appendTo; // TODO: write tests
            }
            dragging.emitter.on('pointerdown', this.handlePointerDown);
            dragging.emitter.on('dragstart', this.handleDragStart);
            new ExternalElementDragging(dragging, settings.eventData);
        }
        ExternalDraggable.prototype.destroy = function () {
            this.dragging.destroy();
        };
        return ExternalDraggable;
    }());

    /*
    Detects when a *THIRD-PARTY* drag-n-drop system interacts with elements.
    The third-party system is responsible for drawing the visuals effects of the drag.
    This class simply monitors for pointer movements and fires events.
    It also has the ability to hide the moving element (the "mirror") during the drag.
    */
    var InferredElementDragging = /** @class */ (function (_super) {
        __extends(InferredElementDragging, _super);
        function InferredElementDragging(containerEl) {
            var _this = _super.call(this, containerEl) || this;
            _this.shouldIgnoreMove = false;
            _this.mirrorSelector = '';
            _this.currentMirrorEl = null;
            _this.handlePointerDown = function (ev) {
                _this.emitter.trigger('pointerdown', ev);
                if (!_this.shouldIgnoreMove) {
                    // fire dragstart right away. does not support delay or min-distance
                    _this.emitter.trigger('dragstart', ev);
                }
            };
            _this.handlePointerMove = function (ev) {
                if (!_this.shouldIgnoreMove) {
                    _this.emitter.trigger('dragmove', ev);
                }
            };
            _this.handlePointerUp = function (ev) {
                _this.emitter.trigger('pointerup', ev);
                if (!_this.shouldIgnoreMove) {
                    // fire dragend right away. does not support a revert animation
                    _this.emitter.trigger('dragend', ev);
                }
            };
            var pointer = _this.pointer = new PointerDragging(containerEl);
            pointer.emitter.on('pointerdown', _this.handlePointerDown);
            pointer.emitter.on('pointermove', _this.handlePointerMove);
            pointer.emitter.on('pointerup', _this.handlePointerUp);
            return _this;
        }
        InferredElementDragging.prototype.destroy = function () {
            this.pointer.destroy();
        };
        InferredElementDragging.prototype.setIgnoreMove = function (bool) {
            this.shouldIgnoreMove = bool;
        };
        InferredElementDragging.prototype.setMirrorIsVisible = function (bool) {
            if (bool) {
                // restore a previously hidden element.
                // use the reference in case the selector class has already been removed.
                if (this.currentMirrorEl) {
                    this.currentMirrorEl.style.visibility = '';
                    this.currentMirrorEl = null;
                }
            }
            else {
                var mirrorEl = this.mirrorSelector ?
                    document.querySelector(this.mirrorSelector) :
                    null;
                if (mirrorEl) {
                    this.currentMirrorEl = mirrorEl;
                    mirrorEl.style.visibility = 'hidden';
                }
            }
        };
        return InferredElementDragging;
    }(core.ElementDragging));

    /*
    Bridges third-party drag-n-drop systems with FullCalendar.
    Must be instantiated and destroyed by caller.
    */
    var ThirdPartyDraggable = /** @class */ (function () {
        function ThirdPartyDraggable(containerOrSettings, settings) {
            var containerEl = document;
            if (
            // wish we could just test instanceof EventTarget, but doesn't work in IE11
            containerOrSettings === document ||
                containerOrSettings instanceof Element) {
                containerEl = containerOrSettings;
                settings = settings || {};
            }
            else {
                settings = (containerOrSettings || {});
            }
            var dragging = this.dragging = new InferredElementDragging(containerEl);
            if (typeof settings.itemSelector === 'string') {
                dragging.pointer.selector = settings.itemSelector;
            }
            else if (containerEl === document) {
                dragging.pointer.selector = '[data-event]';
            }
            if (typeof settings.mirrorSelector === 'string') {
                dragging.mirrorSelector = settings.mirrorSelector;
            }
            new ExternalElementDragging(dragging, settings.eventData);
        }
        ThirdPartyDraggable.prototype.destroy = function () {
            this.dragging.destroy();
        };
        return ThirdPartyDraggable;
    }());

    var main = core.createPlugin({
        componentInteractions: [DateClicking, DateSelecting, EventDragging, EventDragging$1],
        calendarInteractions: [UnselectAuto],
        elementDraggingImpl: FeaturefulElementDragging
    });

    exports.Draggable = ExternalDraggable;
    exports.FeaturefulElementDragging = FeaturefulElementDragging;
    exports.PointerDragging = PointerDragging;
    exports.ThirdPartyDraggable = ThirdPartyDraggable;
    exports.default = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

/*!
FullCalendar List View Plugin v4.4.2
Docs & License: https://fullcalendar.io/
(c) 2019 Adam Shaw
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fullcalendar/core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fullcalendar/core'], factory) :
    (global = global || self, factory(global.FullCalendarList = {}, global.FullCalendar));
}(this, function (exports, core) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var ListEventRenderer = /** @class */ (function (_super) {
        __extends(ListEventRenderer, _super);
        function ListEventRenderer(listView) {
            var _this = _super.call(this) || this;
            _this.listView = listView;
            return _this;
        }
        ListEventRenderer.prototype.attachSegs = function (segs) {
            if (!segs.length) {
                this.listView.renderEmptyMessage();
            }
            else {
                this.listView.renderSegList(segs);
            }
        };
        ListEventRenderer.prototype.detachSegs = function () {
        };
        // generates the HTML for a single event row
        ListEventRenderer.prototype.renderSegHtml = function (seg) {
            var _a = this.context, theme = _a.theme, options = _a.options;
            var eventRange = seg.eventRange;
            var eventDef = eventRange.def;
            var eventInstance = eventRange.instance;
            var eventUi = eventRange.ui;
            var url = eventDef.url;
            var classes = ['fc-list-item'].concat(eventUi.classNames);
            var bgColor = eventUi.backgroundColor;
            var timeHtml;
            if (eventDef.allDay) {
                timeHtml = core.getAllDayHtml(options);
            }
            else if (core.isMultiDayRange(eventRange.range)) {
                if (seg.isStart) {
                    timeHtml = core.htmlEscape(this._getTimeText(eventInstance.range.start, seg.end, false // allDay
                    ));
                }
                else if (seg.isEnd) {
                    timeHtml = core.htmlEscape(this._getTimeText(seg.start, eventInstance.range.end, false // allDay
                    ));
                }
                else { // inner segment that lasts the whole day
                    timeHtml = core.getAllDayHtml(options);
                }
            }
            else {
                // Display the normal time text for the *event's* times
                timeHtml = core.htmlEscape(this.getTimeText(eventRange));
            }
            if (url) {
                classes.push('fc-has-url');
            }
            return '<tr class="' + classes.join(' ') + '">' +
                (this.displayEventTime ?
                    '<td class="fc-list-item-time ' + theme.getClass('widgetContent') + '">' +
                        (timeHtml || '') +
                        '</td>' :
                    '') +
                '<td class="fc-list-item-marker ' + theme.getClass('widgetContent') + '">' +
                '<span class="fc-event-dot"' +
                (bgColor ?
                    ' style="background-color:' + bgColor + '"' :
                    '') +
                '></span>' +
                '</td>' +
                '<td class="fc-list-item-title ' + theme.getClass('widgetContent') + '">' +
                '<a' + (url ? ' href="' + core.htmlEscape(url) + '"' : '') + '>' +
                core.htmlEscape(eventDef.title || '') +
                '</a>' +
                '</td>' +
                '</tr>';
        };
        // like "4:00am"
        ListEventRenderer.prototype.computeEventTimeFormat = function () {
            return {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            };
        };
        return ListEventRenderer;
    }(core.FgEventRenderer));

    /*
    Responsible for the scroller, and forwarding event-related actions into the "grid".
    */
    var ListView = /** @class */ (function (_super) {
        __extends(ListView, _super);
        function ListView(viewSpec, parentEl) {
            var _this = _super.call(this, viewSpec, parentEl) || this;
            _this.computeDateVars = core.memoize(computeDateVars);
            _this.eventStoreToSegs = core.memoize(_this._eventStoreToSegs);
            _this.renderSkeleton = core.memoizeRendering(_this._renderSkeleton, _this._unrenderSkeleton);
            var eventRenderer = _this.eventRenderer = new ListEventRenderer(_this);
            _this.renderContent = core.memoizeRendering(eventRenderer.renderSegs.bind(eventRenderer), eventRenderer.unrender.bind(eventRenderer), [_this.renderSkeleton]);
            return _this;
        }
        ListView.prototype.firstContext = function (context) {
            context.calendar.registerInteractiveComponent(this, {
                el: this.el
                // TODO: make aware that it doesn't do Hits
            });
        };
        ListView.prototype.render = function (props, context) {
            _super.prototype.render.call(this, props, context);
            var _a = this.computeDateVars(props.dateProfile), dayDates = _a.dayDates, dayRanges = _a.dayRanges;
            this.dayDates = dayDates;
            this.renderSkeleton(context);
            this.renderContent(context, this.eventStoreToSegs(props.eventStore, props.eventUiBases, dayRanges));
        };
        ListView.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.renderSkeleton.unrender();
            this.renderContent.unrender();
            this.context.calendar.unregisterInteractiveComponent(this);
        };
        ListView.prototype._renderSkeleton = function (context) {
            var theme = context.theme;
            this.el.classList.add('fc-list-view');
            var listViewClassNames = (theme.getClass('listView') || '').split(' '); // wish we didn't have to do this
            for (var _i = 0, listViewClassNames_1 = listViewClassNames; _i < listViewClassNames_1.length; _i++) {
                var listViewClassName = listViewClassNames_1[_i];
                if (listViewClassName) { // in case input was empty string
                    this.el.classList.add(listViewClassName);
                }
            }
            this.scroller = new core.ScrollComponent('hidden', // overflow x
            'auto' // overflow y
            );
            this.el.appendChild(this.scroller.el);
            this.contentEl = this.scroller.el; // shortcut
        };
        ListView.prototype._unrenderSkeleton = function () {
            // TODO: remove classNames
            this.scroller.destroy(); // will remove the Grid too
        };
        ListView.prototype.updateSize = function (isResize, viewHeight, isAuto) {
            _super.prototype.updateSize.call(this, isResize, viewHeight, isAuto);
            this.eventRenderer.computeSizes(isResize);
            this.eventRenderer.assignSizes(isResize);
            this.scroller.clear(); // sets height to 'auto' and clears overflow
            if (!isAuto) {
                this.scroller.setHeight(this.computeScrollerHeight(viewHeight));
            }
        };
        ListView.prototype.computeScrollerHeight = function (viewHeight) {
            return viewHeight -
                core.subtractInnerElHeight(this.el, this.scroller.el); // everything that's NOT the scroller
        };
        ListView.prototype._eventStoreToSegs = function (eventStore, eventUiBases, dayRanges) {
            return this.eventRangesToSegs(core.sliceEventStore(eventStore, eventUiBases, this.props.dateProfile.activeRange, this.context.nextDayThreshold).fg, dayRanges);
        };
        ListView.prototype.eventRangesToSegs = function (eventRanges, dayRanges) {
            var segs = [];
            for (var _i = 0, eventRanges_1 = eventRanges; _i < eventRanges_1.length; _i++) {
                var eventRange = eventRanges_1[_i];
                segs.push.apply(segs, this.eventRangeToSegs(eventRange, dayRanges));
            }
            return segs;
        };
        ListView.prototype.eventRangeToSegs = function (eventRange, dayRanges) {
            var _a = this.context, dateEnv = _a.dateEnv, nextDayThreshold = _a.nextDayThreshold;
            var range = eventRange.range;
            var allDay = eventRange.def.allDay;
            var dayIndex;
            var segRange;
            var seg;
            var segs = [];
            for (dayIndex = 0; dayIndex < dayRanges.length; dayIndex++) {
                segRange = core.intersectRanges(range, dayRanges[dayIndex]);
                if (segRange) {
                    seg = {
                        component: this,
                        eventRange: eventRange,
                        start: segRange.start,
                        end: segRange.end,
                        isStart: eventRange.isStart && segRange.start.valueOf() === range.start.valueOf(),
                        isEnd: eventRange.isEnd && segRange.end.valueOf() === range.end.valueOf(),
                        dayIndex: dayIndex
                    };
                    segs.push(seg);
                    // detect when range won't go fully into the next day,
                    // and mutate the latest seg to the be the end.
                    if (!seg.isEnd && !allDay &&
                        dayIndex + 1 < dayRanges.length &&
                        range.end <
                            dateEnv.add(dayRanges[dayIndex + 1].start, nextDayThreshold)) {
                        seg.end = range.end;
                        seg.isEnd = true;
                        break;
                    }
                }
            }
            return segs;
        };
        ListView.prototype.renderEmptyMessage = function () {
            this.contentEl.innerHTML =
                '<div class="fc-list-empty-wrap2">' + // TODO: try less wraps
                    '<div class="fc-list-empty-wrap1">' +
                    '<div class="fc-list-empty">' +
                    core.htmlEscape(this.context.options.noEventsMessage) +
                    '</div>' +
                    '</div>' +
                    '</div>';
        };
        // called by ListEventRenderer
        ListView.prototype.renderSegList = function (allSegs) {
            var theme = this.context.theme;
            var segsByDay = this.groupSegsByDay(allSegs); // sparse array
            var dayIndex;
            var daySegs;
            var i;
            var tableEl = core.htmlToElement('<table class="fc-list-table ' + theme.getClass('tableList') + '"><tbody></tbody></table>');
            var tbodyEl = tableEl.querySelector('tbody');
            for (dayIndex = 0; dayIndex < segsByDay.length; dayIndex++) {
                daySegs = segsByDay[dayIndex];
                if (daySegs) { // sparse array, so might be undefined
                    // append a day header
                    tbodyEl.appendChild(this.buildDayHeaderRow(this.dayDates[dayIndex]));
                    daySegs = this.eventRenderer.sortEventSegs(daySegs);
                    for (i = 0; i < daySegs.length; i++) {
                        tbodyEl.appendChild(daySegs[i].el); // append event row
                    }
                }
            }
            this.contentEl.innerHTML = '';
            this.contentEl.appendChild(tableEl);
        };
        // Returns a sparse array of arrays, segs grouped by their dayIndex
        ListView.prototype.groupSegsByDay = function (segs) {
            var segsByDay = []; // sparse array
            var i;
            var seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                (segsByDay[seg.dayIndex] || (segsByDay[seg.dayIndex] = []))
                    .push(seg);
            }
            return segsByDay;
        };
        // generates the HTML for the day headers that live amongst the event rows
        ListView.prototype.buildDayHeaderRow = function (dayDate) {
            var _a = this.context, theme = _a.theme, dateEnv = _a.dateEnv, options = _a.options;
            var mainFormat = core.createFormatter(options.listDayFormat); // TODO: cache
            var altFormat = core.createFormatter(options.listDayAltFormat); // TODO: cache
            return core.createElement('tr', {
                className: 'fc-list-heading',
                'data-date': dateEnv.formatIso(dayDate, { omitTime: true })
            }, '<td class="' + (theme.getClass('tableListHeading') ||
                theme.getClass('widgetHeader')) + '" colspan="3">' +
                (mainFormat ?
                    core.buildGotoAnchorHtml(options, dateEnv, dayDate, { 'class': 'fc-list-heading-main' }, core.htmlEscape(dateEnv.format(dayDate, mainFormat)) // inner HTML
                    ) :
                    '') +
                (altFormat ?
                    core.buildGotoAnchorHtml(options, dateEnv, dayDate, { 'class': 'fc-list-heading-alt' }, core.htmlEscape(dateEnv.format(dayDate, altFormat)) // inner HTML
                    ) :
                    '') +
                '</td>');
        };
        return ListView;
    }(core.View));
    ListView.prototype.fgSegSelector = '.fc-list-item'; // which elements accept event actions
    function computeDateVars(dateProfile) {
        var dayStart = core.startOfDay(dateProfile.renderRange.start);
        var viewEnd = dateProfile.renderRange.end;
        var dayDates = [];
        var dayRanges = [];
        while (dayStart < viewEnd) {
            dayDates.push(dayStart);
            dayRanges.push({
                start: dayStart,
                end: core.addDays(dayStart, 1)
            });
            dayStart = core.addDays(dayStart, 1);
        }
        return { dayDates: dayDates, dayRanges: dayRanges };
    }

    var main = core.createPlugin({
        views: {
            list: {
                class: ListView,
                buttonTextKey: 'list',
                listDayFormat: { month: 'long', day: 'numeric', year: 'numeric' } // like "January 1, 2016"
            },
            listDay: {
                type: 'list',
                duration: { days: 1 },
                listDayFormat: { weekday: 'long' } // day-of-week is all we need. full date is probably in header
            },
            listWeek: {
                type: 'list',
                duration: { weeks: 1 },
                listDayFormat: { weekday: 'long' },
                listDayAltFormat: { month: 'long', day: 'numeric', year: 'numeric' }
            },
            listMonth: {
                type: 'list',
                duration: { month: 1 },
                listDayAltFormat: { weekday: 'long' } // day-of-week is nice-to-have
            },
            listYear: {
                type: 'list',
                duration: { year: 1 },
                listDayAltFormat: { weekday: 'long' } // day-of-week is nice-to-have
            }
        }
    });

    exports.ListView = ListView;
    exports.default = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

/*!
FullCalendar Time Grid Plugin v4.4.2
Docs & License: https://fullcalendar.io/
(c) 2019 Adam Shaw
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fullcalendar/core'), require('@fullcalendar/daygrid')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fullcalendar/core', '@fullcalendar/daygrid'], factory) :
    (global = global || self, factory(global.FullCalendarTimeGrid = {}, global.FullCalendar, global.FullCalendarDayGrid));
}(this, function (exports, core, daygrid) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    /*
    Only handles foreground segs.
    Does not own rendering. Use for low-level util methods by TimeGrid.
    */
    var TimeGridEventRenderer = /** @class */ (function (_super) {
        __extends(TimeGridEventRenderer, _super);
        function TimeGridEventRenderer(timeGrid) {
            var _this = _super.call(this) || this;
            _this.timeGrid = timeGrid;
            return _this;
        }
        TimeGridEventRenderer.prototype.renderSegs = function (context, segs, mirrorInfo) {
            _super.prototype.renderSegs.call(this, context, segs, mirrorInfo);
            // TODO: dont do every time. memoize
            this.fullTimeFormat = core.createFormatter({
                hour: 'numeric',
                minute: '2-digit',
                separator: this.context.options.defaultRangeSeparator
            });
        };
        // Given an array of foreground segments, render a DOM element for each, computes position,
        // and attaches to the column inner-container elements.
        TimeGridEventRenderer.prototype.attachSegs = function (segs, mirrorInfo) {
            var segsByCol = this.timeGrid.groupSegsByCol(segs);
            // order the segs within each column
            // TODO: have groupSegsByCol do this?
            for (var col = 0; col < segsByCol.length; col++) {
                segsByCol[col] = this.sortEventSegs(segsByCol[col]);
            }
            this.segsByCol = segsByCol;
            this.timeGrid.attachSegsByCol(segsByCol, this.timeGrid.fgContainerEls);
        };
        TimeGridEventRenderer.prototype.detachSegs = function (segs) {
            segs.forEach(function (seg) {
                core.removeElement(seg.el);
            });
            this.segsByCol = null;
        };
        TimeGridEventRenderer.prototype.computeSegSizes = function (allSegs) {
            var _a = this, timeGrid = _a.timeGrid, segsByCol = _a.segsByCol;
            var colCnt = timeGrid.colCnt;
            timeGrid.computeSegVerticals(allSegs); // horizontals relies on this
            if (segsByCol) {
                for (var col = 0; col < colCnt; col++) {
                    this.computeSegHorizontals(segsByCol[col]); // compute horizontal coordinates, z-index's, and reorder the array
                }
            }
        };
        TimeGridEventRenderer.prototype.assignSegSizes = function (allSegs) {
            var _a = this, timeGrid = _a.timeGrid, segsByCol = _a.segsByCol;
            var colCnt = timeGrid.colCnt;
            timeGrid.assignSegVerticals(allSegs); // horizontals relies on this
            if (segsByCol) {
                for (var col = 0; col < colCnt; col++) {
                    this.assignSegCss(segsByCol[col]);
                }
            }
        };
        // Computes a default event time formatting string if `eventTimeFormat` is not explicitly defined
        TimeGridEventRenderer.prototype.computeEventTimeFormat = function () {
            return {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: false
            };
        };
        // Computes a default `displayEventEnd` value if one is not expliclty defined
        TimeGridEventRenderer.prototype.computeDisplayEventEnd = function () {
            return true;
        };
        // Renders the HTML for a single event segment's default rendering
        TimeGridEventRenderer.prototype.renderSegHtml = function (seg, mirrorInfo) {
            var eventRange = seg.eventRange;
            var eventDef = eventRange.def;
            var eventUi = eventRange.ui;
            var allDay = eventDef.allDay;
            var isDraggable = core.computeEventDraggable(this.context, eventDef, eventUi);
            var isResizableFromStart = seg.isStart && core.computeEventStartResizable(this.context, eventDef, eventUi);
            var isResizableFromEnd = seg.isEnd && core.computeEventEndResizable(this.context, eventDef, eventUi);
            var classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd, mirrorInfo);
            var skinCss = core.cssToStr(this.getSkinCss(eventUi));
            var timeText;
            var fullTimeText; // more verbose time text. for the print stylesheet
            var startTimeText; // just the start time text
            classes.unshift('fc-time-grid-event');
            // if the event appears to span more than one day...
            if (core.isMultiDayRange(eventRange.range)) {
                // Don't display time text on segments that run entirely through a day.
                // That would appear as midnight-midnight and would look dumb.
                // Otherwise, display the time text for the *segment's* times (like 6pm-midnight or midnight-10am)
                if (seg.isStart || seg.isEnd) {
                    var unzonedStart = seg.start;
                    var unzonedEnd = seg.end;
                    timeText = this._getTimeText(unzonedStart, unzonedEnd, allDay); // TODO: give the timezones
                    fullTimeText = this._getTimeText(unzonedStart, unzonedEnd, allDay, this.fullTimeFormat);
                    startTimeText = this._getTimeText(unzonedStart, unzonedEnd, allDay, null, false); // displayEnd=false
                }
            }
            else {
                // Display the normal time text for the *event's* times
                timeText = this.getTimeText(eventRange);
                fullTimeText = this.getTimeText(eventRange, this.fullTimeFormat);
                startTimeText = this.getTimeText(eventRange, null, false); // displayEnd=false
            }
            return '<a class="' + classes.join(' ') + '"' +
                (eventDef.url ?
                    ' href="' + core.htmlEscape(eventDef.url) + '"' :
                    '') +
                (skinCss ?
                    ' style="' + skinCss + '"' :
                    '') +
                '>' +
                '<div class="fc-content">' +
                (timeText ?
                    '<div class="fc-time"' +
                        ' data-start="' + core.htmlEscape(startTimeText) + '"' +
                        ' data-full="' + core.htmlEscape(fullTimeText) + '"' +
                        '>' +
                        '<span>' + core.htmlEscape(timeText) + '</span>' +
                        '</div>' :
                    '') +
                (eventDef.title ?
                    '<div class="fc-title">' +
                        core.htmlEscape(eventDef.title) +
                        '</div>' :
                    '') +
                '</div>' +
                /* TODO: write CSS for this
                (isResizableFromStart ?
                  '<div class="fc-resizer fc-start-resizer"></div>' :
                  ''
                  ) +
                */
                (isResizableFromEnd ?
                    '<div class="fc-resizer fc-end-resizer"></div>' :
                    '') +
                '</a>';
        };
        // Given an array of segments that are all in the same column, sets the backwardCoord and forwardCoord on each.
        // Assumed the segs are already ordered.
        // NOTE: Also reorders the given array by date!
        TimeGridEventRenderer.prototype.computeSegHorizontals = function (segs) {
            var levels;
            var level0;
            var i;
            levels = buildSlotSegLevels(segs);
            computeForwardSlotSegs(levels);
            if ((level0 = levels[0])) {
                for (i = 0; i < level0.length; i++) {
                    computeSlotSegPressures(level0[i]);
                }
                for (i = 0; i < level0.length; i++) {
                    this.computeSegForwardBack(level0[i], 0, 0);
                }
            }
        };
        // Calculate seg.forwardCoord and seg.backwardCoord for the segment, where both values range
        // from 0 to 1. If the calendar is left-to-right, the seg.backwardCoord maps to "left" and
        // seg.forwardCoord maps to "right" (via percentage). Vice-versa if the calendar is right-to-left.
        //
        // The segment might be part of a "series", which means consecutive segments with the same pressure
        // who's width is unknown until an edge has been hit. `seriesBackwardPressure` is the number of
        // segments behind this one in the current series, and `seriesBackwardCoord` is the starting
        // coordinate of the first segment in the series.
        TimeGridEventRenderer.prototype.computeSegForwardBack = function (seg, seriesBackwardPressure, seriesBackwardCoord) {
            var forwardSegs = seg.forwardSegs;
            var i;
            if (seg.forwardCoord === undefined) { // not already computed
                if (!forwardSegs.length) {
                    // if there are no forward segments, this segment should butt up against the edge
                    seg.forwardCoord = 1;
                }
                else {
                    // sort highest pressure first
                    this.sortForwardSegs(forwardSegs);
                    // this segment's forwardCoord will be calculated from the backwardCoord of the
                    // highest-pressure forward segment.
                    this.computeSegForwardBack(forwardSegs[0], seriesBackwardPressure + 1, seriesBackwardCoord);
                    seg.forwardCoord = forwardSegs[0].backwardCoord;
                }
                // calculate the backwardCoord from the forwardCoord. consider the series
                seg.backwardCoord = seg.forwardCoord -
                    (seg.forwardCoord - seriesBackwardCoord) / // available width for series
                        (seriesBackwardPressure + 1); // # of segments in the series
                // use this segment's coordinates to computed the coordinates of the less-pressurized
                // forward segments
                for (i = 0; i < forwardSegs.length; i++) {
                    this.computeSegForwardBack(forwardSegs[i], 0, seg.forwardCoord);
                }
            }
        };
        TimeGridEventRenderer.prototype.sortForwardSegs = function (forwardSegs) {
            var objs = forwardSegs.map(buildTimeGridSegCompareObj);
            var specs = [
                // put higher-pressure first
                { field: 'forwardPressure', order: -1 },
                // put segments that are closer to initial edge first (and favor ones with no coords yet)
                { field: 'backwardCoord', order: 1 }
            ].concat(this.context.eventOrderSpecs);
            objs.sort(function (obj0, obj1) {
                return core.compareByFieldSpecs(obj0, obj1, specs);
            });
            return objs.map(function (c) {
                return c._seg;
            });
        };
        // Given foreground event segments that have already had their position coordinates computed,
        // assigns position-related CSS values to their elements.
        TimeGridEventRenderer.prototype.assignSegCss = function (segs) {
            for (var _i = 0, segs_1 = segs; _i < segs_1.length; _i++) {
                var seg = segs_1[_i];
                core.applyStyle(seg.el, this.generateSegCss(seg));
                if (seg.level > 0) {
                    seg.el.classList.add('fc-time-grid-event-inset');
                }
                // if the event is short that the title will be cut off,
                // attach a className that condenses the title into the time area.
                if (seg.eventRange.def.title && seg.bottom - seg.top < 30) {
                    seg.el.classList.add('fc-short'); // TODO: "condensed" is a better name
                }
            }
        };
        // Generates an object with CSS properties/values that should be applied to an event segment element.
        // Contains important positioning-related properties that should be applied to any event element, customized or not.
        TimeGridEventRenderer.prototype.generateSegCss = function (seg) {
            var shouldOverlap = this.context.options.slotEventOverlap;
            var backwardCoord = seg.backwardCoord; // the left side if LTR. the right side if RTL. floating-point
            var forwardCoord = seg.forwardCoord; // the right side if LTR. the left side if RTL. floating-point
            var props = this.timeGrid.generateSegVerticalCss(seg); // get top/bottom first
            var isRtl = this.context.isRtl;
            var left; // amount of space from left edge, a fraction of the total width
            var right; // amount of space from right edge, a fraction of the total width
            if (shouldOverlap) {
                // double the width, but don't go beyond the maximum forward coordinate (1.0)
                forwardCoord = Math.min(1, backwardCoord + (forwardCoord - backwardCoord) * 2);
            }
            if (isRtl) {
                left = 1 - forwardCoord;
                right = backwardCoord;
            }
            else {
                left = backwardCoord;
                right = 1 - forwardCoord;
            }
            props.zIndex = seg.level + 1; // convert from 0-base to 1-based
            props.left = left * 100 + '%';
            props.right = right * 100 + '%';
            if (shouldOverlap && seg.forwardPressure) {
                // add padding to the edge so that forward stacked events don't cover the resizer's icon
                props[isRtl ? 'marginLeft' : 'marginRight'] = 10 * 2; // 10 is a guesstimate of the icon's width
            }
            return props;
        };
        return TimeGridEventRenderer;
    }(core.FgEventRenderer));
    // Builds an array of segments "levels". The first level will be the leftmost tier of segments if the calendar is
    // left-to-right, or the rightmost if the calendar is right-to-left. Assumes the segments are already ordered by date.
    function buildSlotSegLevels(segs) {
        var levels = [];
        var i;
        var seg;
        var j;
        for (i = 0; i < segs.length; i++) {
            seg = segs[i];
            // go through all the levels and stop on the first level where there are no collisions
            for (j = 0; j < levels.length; j++) {
                if (!computeSlotSegCollisions(seg, levels[j]).length) {
                    break;
                }
            }
            seg.level = j;
            (levels[j] || (levels[j] = [])).push(seg);
        }
        return levels;
    }
    // For every segment, figure out the other segments that are in subsequent
    // levels that also occupy the same vertical space. Accumulate in seg.forwardSegs
    function computeForwardSlotSegs(levels) {
        var i;
        var level;
        var j;
        var seg;
        var k;
        for (i = 0; i < levels.length; i++) {
            level = levels[i];
            for (j = 0; j < level.length; j++) {
                seg = level[j];
                seg.forwardSegs = [];
                for (k = i + 1; k < levels.length; k++) {
                    computeSlotSegCollisions(seg, levels[k], seg.forwardSegs);
                }
            }
        }
    }
    // Figure out which path forward (via seg.forwardSegs) results in the longest path until
    // the furthest edge is reached. The number of segments in this path will be seg.forwardPressure
    function computeSlotSegPressures(seg) {
        var forwardSegs = seg.forwardSegs;
        var forwardPressure = 0;
        var i;
        var forwardSeg;
        if (seg.forwardPressure === undefined) { // not already computed
            for (i = 0; i < forwardSegs.length; i++) {
                forwardSeg = forwardSegs[i];
                // figure out the child's maximum forward path
                computeSlotSegPressures(forwardSeg);
                // either use the existing maximum, or use the child's forward pressure
                // plus one (for the forwardSeg itself)
                forwardPressure = Math.max(forwardPressure, 1 + forwardSeg.forwardPressure);
            }
            seg.forwardPressure = forwardPressure;
        }
    }
    // Find all the segments in `otherSegs` that vertically collide with `seg`.
    // Append into an optionally-supplied `results` array and return.
    function computeSlotSegCollisions(seg, otherSegs, results) {
        if (results === void 0) { results = []; }
        for (var i = 0; i < otherSegs.length; i++) {
            if (isSlotSegCollision(seg, otherSegs[i])) {
                results.push(otherSegs[i]);
            }
        }
        return results;
    }
    // Do these segments occupy the same vertical space?
    function isSlotSegCollision(seg1, seg2) {
        return seg1.bottom > seg2.top && seg1.top < seg2.bottom;
    }
    function buildTimeGridSegCompareObj(seg) {
        var obj = core.buildSegCompareObj(seg);
        obj.forwardPressure = seg.forwardPressure;
        obj.backwardCoord = seg.backwardCoord;
        return obj;
    }

    var TimeGridMirrorRenderer = /** @class */ (function (_super) {
        __extends(TimeGridMirrorRenderer, _super);
        function TimeGridMirrorRenderer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TimeGridMirrorRenderer.prototype.attachSegs = function (segs, mirrorInfo) {
            this.segsByCol = this.timeGrid.groupSegsByCol(segs);
            this.timeGrid.attachSegsByCol(this.segsByCol, this.timeGrid.mirrorContainerEls);
            this.sourceSeg = mirrorInfo.sourceSeg;
        };
        TimeGridMirrorRenderer.prototype.generateSegCss = function (seg) {
            var props = _super.prototype.generateSegCss.call(this, seg);
            var sourceSeg = this.sourceSeg;
            if (sourceSeg && sourceSeg.col === seg.col) {
                var sourceSegProps = _super.prototype.generateSegCss.call(this, sourceSeg);
                props.left = sourceSegProps.left;
                props.right = sourceSegProps.right;
                props.marginLeft = sourceSegProps.marginLeft;
                props.marginRight = sourceSegProps.marginRight;
            }
            return props;
        };
        return TimeGridMirrorRenderer;
    }(TimeGridEventRenderer));

    var TimeGridFillRenderer = /** @class */ (function (_super) {
        __extends(TimeGridFillRenderer, _super);
        function TimeGridFillRenderer(timeGrid) {
            var _this = _super.call(this) || this;
            _this.timeGrid = timeGrid;
            return _this;
        }
        TimeGridFillRenderer.prototype.attachSegs = function (type, segs) {
            var timeGrid = this.timeGrid;
            var containerEls;
            // TODO: more efficient lookup
            if (type === 'bgEvent') {
                containerEls = timeGrid.bgContainerEls;
            }
            else if (type === 'businessHours') {
                containerEls = timeGrid.businessContainerEls;
            }
            else if (type === 'highlight') {
                containerEls = timeGrid.highlightContainerEls;
            }
            timeGrid.attachSegsByCol(timeGrid.groupSegsByCol(segs), containerEls);
            return segs.map(function (seg) {
                return seg.el;
            });
        };
        TimeGridFillRenderer.prototype.computeSegSizes = function (segs) {
            this.timeGrid.computeSegVerticals(segs);
        };
        TimeGridFillRenderer.prototype.assignSegSizes = function (segs) {
            this.timeGrid.assignSegVerticals(segs);
        };
        return TimeGridFillRenderer;
    }(core.FillRenderer));

    /* A component that renders one or more columns of vertical time slots
    ----------------------------------------------------------------------------------------------------------------------*/
    // potential nice values for the slot-duration and interval-duration
    // from largest to smallest
    var AGENDA_STOCK_SUB_DURATIONS = [
        { hours: 1 },
        { minutes: 30 },
        { minutes: 15 },
        { seconds: 30 },
        { seconds: 15 }
    ];
    var TimeGrid = /** @class */ (function (_super) {
        __extends(TimeGrid, _super);
        function TimeGrid(el, renderProps) {
            var _this = _super.call(this, el) || this;
            _this.isSlatSizesDirty = false;
            _this.isColSizesDirty = false;
            _this.processOptions = core.memoize(_this._processOptions);
            _this.renderSkeleton = core.memoizeRendering(_this._renderSkeleton);
            _this.renderSlats = core.memoizeRendering(_this._renderSlats, null, [_this.renderSkeleton]);
            _this.renderColumns = core.memoizeRendering(_this._renderColumns, _this._unrenderColumns, [_this.renderSkeleton]);
            _this.renderProps = renderProps;
            var renderColumns = _this.renderColumns;
            var eventRenderer = _this.eventRenderer = new TimeGridEventRenderer(_this);
            var fillRenderer = _this.fillRenderer = new TimeGridFillRenderer(_this);
            _this.mirrorRenderer = new TimeGridMirrorRenderer(_this);
            _this.renderBusinessHours = core.memoizeRendering(fillRenderer.renderSegs.bind(fillRenderer, 'businessHours'), fillRenderer.unrender.bind(fillRenderer, 'businessHours'), [renderColumns]);
            _this.renderDateSelection = core.memoizeRendering(_this._renderDateSelection, _this._unrenderDateSelection, [renderColumns]);
            _this.renderFgEvents = core.memoizeRendering(eventRenderer.renderSegs.bind(eventRenderer), eventRenderer.unrender.bind(eventRenderer), [renderColumns]);
            _this.renderBgEvents = core.memoizeRendering(fillRenderer.renderSegs.bind(fillRenderer, 'bgEvent'), fillRenderer.unrender.bind(fillRenderer, 'bgEvent'), [renderColumns]);
            _this.renderEventSelection = core.memoizeRendering(eventRenderer.selectByInstanceId.bind(eventRenderer), eventRenderer.unselectByInstanceId.bind(eventRenderer), [_this.renderFgEvents]);
            _this.renderEventDrag = core.memoizeRendering(_this._renderEventDrag, _this._unrenderEventDrag, [renderColumns]);
            _this.renderEventResize = core.memoizeRendering(_this._renderEventResize, _this._unrenderEventResize, [renderColumns]);
            return _this;
        }
        /* Options
        ------------------------------------------------------------------------------------------------------------------*/
        // Parses various options into properties of this object
        // MUST have context already set
        TimeGrid.prototype._processOptions = function (options) {
            var slotDuration = options.slotDuration, snapDuration = options.snapDuration;
            var snapsPerSlot;
            var input;
            slotDuration = core.createDuration(slotDuration);
            snapDuration = snapDuration ? core.createDuration(snapDuration) : slotDuration;
            snapsPerSlot = core.wholeDivideDurations(slotDuration, snapDuration);
            if (snapsPerSlot === null) {
                snapDuration = slotDuration;
                snapsPerSlot = 1;
                // TODO: say warning?
            }
            this.slotDuration = slotDuration;
            this.snapDuration = snapDuration;
            this.snapsPerSlot = snapsPerSlot;
            // might be an array value (for TimelineView).
            // if so, getting the most granular entry (the last one probably).
            input = options.slotLabelFormat;
            if (Array.isArray(input)) {
                input = input[input.length - 1];
            }
            this.labelFormat = core.createFormatter(input || {
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: true,
                meridiem: 'short'
            });
            input = options.slotLabelInterval;
            this.labelInterval = input ?
                core.createDuration(input) :
                this.computeLabelInterval(slotDuration);
        };
        // Computes an automatic value for slotLabelInterval
        TimeGrid.prototype.computeLabelInterval = function (slotDuration) {
            var i;
            var labelInterval;
            var slotsPerLabel;
            // find the smallest stock label interval that results in more than one slots-per-label
            for (i = AGENDA_STOCK_SUB_DURATIONS.length - 1; i >= 0; i--) {
                labelInterval = core.createDuration(AGENDA_STOCK_SUB_DURATIONS[i]);
                slotsPerLabel = core.wholeDivideDurations(labelInterval, slotDuration);
                if (slotsPerLabel !== null && slotsPerLabel > 1) {
                    return labelInterval;
                }
            }
            return slotDuration; // fall back
        };
        /* Rendering
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype.render = function (props, context) {
            this.processOptions(context.options);
            var cells = props.cells;
            this.colCnt = cells.length;
            this.renderSkeleton(context.theme);
            this.renderSlats(props.dateProfile);
            this.renderColumns(props.cells, props.dateProfile);
            this.renderBusinessHours(context, props.businessHourSegs);
            this.renderDateSelection(props.dateSelectionSegs);
            this.renderFgEvents(context, props.fgEventSegs);
            this.renderBgEvents(context, props.bgEventSegs);
            this.renderEventSelection(props.eventSelection);
            this.renderEventDrag(props.eventDrag);
            this.renderEventResize(props.eventResize);
        };
        TimeGrid.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            // should unrender everything else too
            this.renderSlats.unrender();
            this.renderColumns.unrender();
            this.renderSkeleton.unrender();
        };
        TimeGrid.prototype.updateSize = function (isResize) {
            var _a = this, fillRenderer = _a.fillRenderer, eventRenderer = _a.eventRenderer, mirrorRenderer = _a.mirrorRenderer;
            if (isResize || this.isSlatSizesDirty) {
                this.buildSlatPositions();
                this.isSlatSizesDirty = false;
            }
            if (isResize || this.isColSizesDirty) {
                this.buildColPositions();
                this.isColSizesDirty = false;
            }
            fillRenderer.computeSizes(isResize);
            eventRenderer.computeSizes(isResize);
            mirrorRenderer.computeSizes(isResize);
            fillRenderer.assignSizes(isResize);
            eventRenderer.assignSizes(isResize);
            mirrorRenderer.assignSizes(isResize);
        };
        TimeGrid.prototype._renderSkeleton = function (theme) {
            var el = this.el;
            el.innerHTML =
                '<div class="fc-bg"></div>' +
                    '<div class="fc-slats"></div>' +
                    '<hr class="fc-divider ' + theme.getClass('widgetHeader') + '" style="display:none" />';
            this.rootBgContainerEl = el.querySelector('.fc-bg');
            this.slatContainerEl = el.querySelector('.fc-slats');
            this.bottomRuleEl = el.querySelector('.fc-divider');
        };
        TimeGrid.prototype._renderSlats = function (dateProfile) {
            var theme = this.context.theme;
            this.slatContainerEl.innerHTML =
                '<table class="' + theme.getClass('tableGrid') + '">' +
                    this.renderSlatRowHtml(dateProfile) +
                    '</table>';
            this.slatEls = core.findElements(this.slatContainerEl, 'tr');
            this.slatPositions = new core.PositionCache(this.el, this.slatEls, false, true // vertical
            );
            this.isSlatSizesDirty = true;
        };
        // Generates the HTML for the horizontal "slats" that run width-wise. Has a time axis on a side. Depends on RTL.
        TimeGrid.prototype.renderSlatRowHtml = function (dateProfile) {
            var _a = this.context, dateEnv = _a.dateEnv, theme = _a.theme, isRtl = _a.isRtl;
            var html = '';
            var dayStart = core.startOfDay(dateProfile.renderRange.start);
            var slotTime = dateProfile.minTime;
            var slotIterator = core.createDuration(0);
            var slotDate; // will be on the view's first day, but we only care about its time
            var isLabeled;
            var axisHtml;
            // Calculate the time for each slot
            while (core.asRoughMs(slotTime) < core.asRoughMs(dateProfile.maxTime)) {
                slotDate = dateEnv.add(dayStart, slotTime);
                isLabeled = core.wholeDivideDurations(slotIterator, this.labelInterval) !== null;
                axisHtml =
                    '<td class="fc-axis fc-time ' + theme.getClass('widgetContent') + '">' +
                        (isLabeled ?
                            '<span>' + // for matchCellWidths
                                core.htmlEscape(dateEnv.format(slotDate, this.labelFormat)) +
                                '</span>' :
                            '') +
                        '</td>';
                html +=
                    '<tr data-time="' + core.formatIsoTimeString(slotDate) + '"' +
                        (isLabeled ? '' : ' class="fc-minor"') +
                        '>' +
                        (!isRtl ? axisHtml : '') +
                        '<td class="' + theme.getClass('widgetContent') + '"></td>' +
                        (isRtl ? axisHtml : '') +
                        '</tr>';
                slotTime = core.addDurations(slotTime, this.slotDuration);
                slotIterator = core.addDurations(slotIterator, this.slotDuration);
            }
            return html;
        };
        TimeGrid.prototype._renderColumns = function (cells, dateProfile) {
            var _a = this.context, calendar = _a.calendar, view = _a.view, isRtl = _a.isRtl, theme = _a.theme, dateEnv = _a.dateEnv;
            var bgRow = new daygrid.DayBgRow(this.context);
            this.rootBgContainerEl.innerHTML =
                '<table class="' + theme.getClass('tableGrid') + '">' +
                    bgRow.renderHtml({
                        cells: cells,
                        dateProfile: dateProfile,
                        renderIntroHtml: this.renderProps.renderBgIntroHtml
                    }) +
                    '</table>';
            this.colEls = core.findElements(this.el, '.fc-day, .fc-disabled-day');
            for (var col = 0; col < this.colCnt; col++) {
                calendar.publiclyTrigger('dayRender', [
                    {
                        date: dateEnv.toDate(cells[col].date),
                        el: this.colEls[col],
                        view: view
                    }
                ]);
            }
            if (isRtl) {
                this.colEls.reverse();
            }
            this.colPositions = new core.PositionCache(this.el, this.colEls, true, // horizontal
            false);
            this.renderContentSkeleton();
            this.isColSizesDirty = true;
        };
        TimeGrid.prototype._unrenderColumns = function () {
            this.unrenderContentSkeleton();
        };
        /* Content Skeleton
        ------------------------------------------------------------------------------------------------------------------*/
        // Renders the DOM that the view's content will live in
        TimeGrid.prototype.renderContentSkeleton = function () {
            var isRtl = this.context.isRtl;
            var parts = [];
            var skeletonEl;
            parts.push(this.renderProps.renderIntroHtml());
            for (var i = 0; i < this.colCnt; i++) {
                parts.push('<td>' +
                    '<div class="fc-content-col">' +
                    '<div class="fc-event-container fc-mirror-container"></div>' +
                    '<div class="fc-event-container"></div>' +
                    '<div class="fc-highlight-container"></div>' +
                    '<div class="fc-bgevent-container"></div>' +
                    '<div class="fc-business-container"></div>' +
                    '</div>' +
                    '</td>');
            }
            if (isRtl) {
                parts.reverse();
            }
            skeletonEl = this.contentSkeletonEl = core.htmlToElement('<div class="fc-content-skeleton">' +
                '<table>' +
                '<tr>' + parts.join('') + '</tr>' +
                '</table>' +
                '</div>');
            this.colContainerEls = core.findElements(skeletonEl, '.fc-content-col');
            this.mirrorContainerEls = core.findElements(skeletonEl, '.fc-mirror-container');
            this.fgContainerEls = core.findElements(skeletonEl, '.fc-event-container:not(.fc-mirror-container)');
            this.bgContainerEls = core.findElements(skeletonEl, '.fc-bgevent-container');
            this.highlightContainerEls = core.findElements(skeletonEl, '.fc-highlight-container');
            this.businessContainerEls = core.findElements(skeletonEl, '.fc-business-container');
            if (isRtl) {
                this.colContainerEls.reverse();
                this.mirrorContainerEls.reverse();
                this.fgContainerEls.reverse();
                this.bgContainerEls.reverse();
                this.highlightContainerEls.reverse();
                this.businessContainerEls.reverse();
            }
            this.el.appendChild(skeletonEl);
        };
        TimeGrid.prototype.unrenderContentSkeleton = function () {
            core.removeElement(this.contentSkeletonEl);
        };
        // Given a flat array of segments, return an array of sub-arrays, grouped by each segment's col
        TimeGrid.prototype.groupSegsByCol = function (segs) {
            var segsByCol = [];
            var i;
            for (i = 0; i < this.colCnt; i++) {
                segsByCol.push([]);
            }
            for (i = 0; i < segs.length; i++) {
                segsByCol[segs[i].col].push(segs[i]);
            }
            return segsByCol;
        };
        // Given segments grouped by column, insert the segments' elements into a parallel array of container
        // elements, each living within a column.
        TimeGrid.prototype.attachSegsByCol = function (segsByCol, containerEls) {
            var col;
            var segs;
            var i;
            for (col = 0; col < this.colCnt; col++) { // iterate each column grouping
                segs = segsByCol[col];
                for (i = 0; i < segs.length; i++) {
                    containerEls[col].appendChild(segs[i].el);
                }
            }
        };
        /* Now Indicator
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype.getNowIndicatorUnit = function () {
            return 'minute'; // will refresh on the minute
        };
        TimeGrid.prototype.renderNowIndicator = function (segs, date) {
            // HACK: if date columns not ready for some reason (scheduler)
            if (!this.colContainerEls) {
                return;
            }
            var top = this.computeDateTop(date);
            var nodes = [];
            var i;
            // render lines within the columns
            for (i = 0; i < segs.length; i++) {
                var lineEl = core.createElement('div', { className: 'fc-now-indicator fc-now-indicator-line' });
                lineEl.style.top = top + 'px';
                this.colContainerEls[segs[i].col].appendChild(lineEl);
                nodes.push(lineEl);
            }
            // render an arrow over the axis
            if (segs.length > 0) { // is the current time in view?
                var arrowEl = core.createElement('div', { className: 'fc-now-indicator fc-now-indicator-arrow' });
                arrowEl.style.top = top + 'px';
                this.contentSkeletonEl.appendChild(arrowEl);
                nodes.push(arrowEl);
            }
            this.nowIndicatorEls = nodes;
        };
        TimeGrid.prototype.unrenderNowIndicator = function () {
            if (this.nowIndicatorEls) {
                this.nowIndicatorEls.forEach(core.removeElement);
                this.nowIndicatorEls = null;
            }
        };
        /* Coordinates
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype.getTotalSlatHeight = function () {
            return this.slatContainerEl.getBoundingClientRect().height;
        };
        // Computes the top coordinate, relative to the bounds of the grid, of the given date.
        // A `startOfDayDate` must be given for avoiding ambiguity over how to treat midnight.
        TimeGrid.prototype.computeDateTop = function (when, startOfDayDate) {
            if (!startOfDayDate) {
                startOfDayDate = core.startOfDay(when);
            }
            return this.computeTimeTop(core.createDuration(when.valueOf() - startOfDayDate.valueOf()));
        };
        // Computes the top coordinate, relative to the bounds of the grid, of the given time (a Duration).
        TimeGrid.prototype.computeTimeTop = function (duration) {
            var len = this.slatEls.length;
            var dateProfile = this.props.dateProfile;
            var slatCoverage = (duration.milliseconds - core.asRoughMs(dateProfile.minTime)) / core.asRoughMs(this.slotDuration); // floating-point value of # of slots covered
            var slatIndex;
            var slatRemainder;
            // compute a floating-point number for how many slats should be progressed through.
            // from 0 to number of slats (inclusive)
            // constrained because minTime/maxTime might be customized.
            slatCoverage = Math.max(0, slatCoverage);
            slatCoverage = Math.min(len, slatCoverage);
            // an integer index of the furthest whole slat
            // from 0 to number slats (*exclusive*, so len-1)
            slatIndex = Math.floor(slatCoverage);
            slatIndex = Math.min(slatIndex, len - 1);
            // how much further through the slatIndex slat (from 0.0-1.0) must be covered in addition.
            // could be 1.0 if slatCoverage is covering *all* the slots
            slatRemainder = slatCoverage - slatIndex;
            return this.slatPositions.tops[slatIndex] +
                this.slatPositions.getHeight(slatIndex) * slatRemainder;
        };
        // For each segment in an array, computes and assigns its top and bottom properties
        TimeGrid.prototype.computeSegVerticals = function (segs) {
            var options = this.context.options;
            var eventMinHeight = options.timeGridEventMinHeight;
            var i;
            var seg;
            var dayDate;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                dayDate = this.props.cells[seg.col].date;
                seg.top = this.computeDateTop(seg.start, dayDate);
                seg.bottom = Math.max(seg.top + eventMinHeight, this.computeDateTop(seg.end, dayDate));
            }
        };
        // Given segments that already have their top/bottom properties computed, applies those values to
        // the segments' elements.
        TimeGrid.prototype.assignSegVerticals = function (segs) {
            var i;
            var seg;
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                core.applyStyle(seg.el, this.generateSegVerticalCss(seg));
            }
        };
        // Generates an object with CSS properties for the top/bottom coordinates of a segment element
        TimeGrid.prototype.generateSegVerticalCss = function (seg) {
            return {
                top: seg.top,
                bottom: -seg.bottom // flipped because needs to be space beyond bottom edge of event container
            };
        };
        /* Sizing
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype.buildPositionCaches = function () {
            this.buildColPositions();
            this.buildSlatPositions();
        };
        TimeGrid.prototype.buildColPositions = function () {
            this.colPositions.build();
        };
        TimeGrid.prototype.buildSlatPositions = function () {
            this.slatPositions.build();
        };
        /* Hit System
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype.positionToHit = function (positionLeft, positionTop) {
            var dateEnv = this.context.dateEnv;
            var _a = this, snapsPerSlot = _a.snapsPerSlot, slatPositions = _a.slatPositions, colPositions = _a.colPositions;
            var colIndex = colPositions.leftToIndex(positionLeft);
            var slatIndex = slatPositions.topToIndex(positionTop);
            if (colIndex != null && slatIndex != null) {
                var slatTop = slatPositions.tops[slatIndex];
                var slatHeight = slatPositions.getHeight(slatIndex);
                var partial = (positionTop - slatTop) / slatHeight; // floating point number between 0 and 1
                var localSnapIndex = Math.floor(partial * snapsPerSlot); // the snap # relative to start of slat
                var snapIndex = slatIndex * snapsPerSlot + localSnapIndex;
                var dayDate = this.props.cells[colIndex].date;
                var time = core.addDurations(this.props.dateProfile.minTime, core.multiplyDuration(this.snapDuration, snapIndex));
                var start = dateEnv.add(dayDate, time);
                var end = dateEnv.add(start, this.snapDuration);
                return {
                    col: colIndex,
                    dateSpan: {
                        range: { start: start, end: end },
                        allDay: false
                    },
                    dayEl: this.colEls[colIndex],
                    relativeRect: {
                        left: colPositions.lefts[colIndex],
                        right: colPositions.rights[colIndex],
                        top: slatTop,
                        bottom: slatTop + slatHeight
                    }
                };
            }
        };
        /* Event Drag Visualization
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype._renderEventDrag = function (state) {
            if (state) {
                this.eventRenderer.hideByHash(state.affectedInstances);
                if (state.isEvent) {
                    this.mirrorRenderer.renderSegs(this.context, state.segs, { isDragging: true, sourceSeg: state.sourceSeg });
                }
                else {
                    this.fillRenderer.renderSegs('highlight', this.context, state.segs);
                }
            }
        };
        TimeGrid.prototype._unrenderEventDrag = function (state) {
            if (state) {
                this.eventRenderer.showByHash(state.affectedInstances);
                if (state.isEvent) {
                    this.mirrorRenderer.unrender(this.context, state.segs, { isDragging: true, sourceSeg: state.sourceSeg });
                }
                else {
                    this.fillRenderer.unrender('highlight', this.context);
                }
            }
        };
        /* Event Resize Visualization
        ------------------------------------------------------------------------------------------------------------------*/
        TimeGrid.prototype._renderEventResize = function (state) {
            if (state) {
                this.eventRenderer.hideByHash(state.affectedInstances);
                this.mirrorRenderer.renderSegs(this.context, state.segs, { isResizing: true, sourceSeg: state.sourceSeg });
            }
        };
        TimeGrid.prototype._unrenderEventResize = function (state) {
            if (state) {
                this.eventRenderer.showByHash(state.affectedInstances);
                this.mirrorRenderer.unrender(this.context, state.segs, { isResizing: true, sourceSeg: state.sourceSeg });
            }
        };
        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/
        // Renders a visual indication of a selection. Overrides the default, which was to simply render a highlight.
        TimeGrid.prototype._renderDateSelection = function (segs) {
            if (segs) {
                if (this.context.options.selectMirror) {
                    this.mirrorRenderer.renderSegs(this.context, segs, { isSelecting: true });
                }
                else {
                    this.fillRenderer.renderSegs('highlight', this.context, segs);
                }
            }
        };
        TimeGrid.prototype._unrenderDateSelection = function (segs) {
            if (segs) {
                if (this.context.options.selectMirror) {
                    this.mirrorRenderer.unrender(this.context, segs, { isSelecting: true });
                }
                else {
                    this.fillRenderer.unrender('highlight', this.context);
                }
            }
        };
        return TimeGrid;
    }(core.DateComponent));

    var AllDaySplitter = /** @class */ (function (_super) {
        __extends(AllDaySplitter, _super);
        function AllDaySplitter() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AllDaySplitter.prototype.getKeyInfo = function () {
            return {
                allDay: {},
                timed: {}
            };
        };
        AllDaySplitter.prototype.getKeysForDateSpan = function (dateSpan) {
            if (dateSpan.allDay) {
                return ['allDay'];
            }
            else {
                return ['timed'];
            }
        };
        AllDaySplitter.prototype.getKeysForEventDef = function (eventDef) {
            if (!eventDef.allDay) {
                return ['timed'];
            }
            else if (core.hasBgRendering(eventDef)) {
                return ['timed', 'allDay'];
            }
            else {
                return ['allDay'];
            }
        };
        return AllDaySplitter;
    }(core.Splitter));

    var TIMEGRID_ALL_DAY_EVENT_LIMIT = 5;
    var WEEK_HEADER_FORMAT = core.createFormatter({ week: 'short' });
    /* An abstract class for all timegrid-related views. Displays one more columns with time slots running vertically.
    ----------------------------------------------------------------------------------------------------------------------*/
    // Is a manager for the TimeGrid subcomponent and possibly the DayGrid subcomponent (if allDaySlot is on).
    // Responsible for managing width/height.
    var AbstractTimeGridView = /** @class */ (function (_super) {
        __extends(AbstractTimeGridView, _super);
        function AbstractTimeGridView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.splitter = new AllDaySplitter();
            _this.renderSkeleton = core.memoizeRendering(_this._renderSkeleton, _this._unrenderSkeleton);
            /* Header Render Methods
            ------------------------------------------------------------------------------------------------------------------*/
            // Generates the HTML that will go before the day-of week header cells
            _this.renderHeadIntroHtml = function () {
                var _a = _this.context, theme = _a.theme, dateEnv = _a.dateEnv, options = _a.options;
                var range = _this.props.dateProfile.renderRange;
                var dayCnt = core.diffDays(range.start, range.end);
                var weekText;
                if (options.weekNumbers) {
                    weekText = dateEnv.format(range.start, WEEK_HEADER_FORMAT);
                    return '' +
                        '<th class="fc-axis fc-week-number ' + theme.getClass('widgetHeader') + '" ' + _this.axisStyleAttr() + '>' +
                        core.buildGotoAnchorHtml(// aside from link, important for matchCellWidths
                        options, dateEnv, { date: range.start, type: 'week', forceOff: dayCnt > 1 }, core.htmlEscape(weekText) // inner HTML
                        ) +
                        '</th>';
                }
                else {
                    return '<th class="fc-axis ' + theme.getClass('widgetHeader') + '" ' + _this.axisStyleAttr() + '></th>';
                }
            };
            /* Time Grid Render Methods
            ------------------------------------------------------------------------------------------------------------------*/
            // Generates the HTML that goes before the bg of the TimeGrid slot area. Long vertical column.
            _this.renderTimeGridBgIntroHtml = function () {
                var theme = _this.context.theme;
                return '<td class="fc-axis ' + theme.getClass('widgetContent') + '" ' + _this.axisStyleAttr() + '></td>';
            };
            // Generates the HTML that goes before all other types of cells.
            // Affects content-skeleton, mirror-skeleton, highlight-skeleton for both the time-grid and day-grid.
            _this.renderTimeGridIntroHtml = function () {
                return '<td class="fc-axis" ' + _this.axisStyleAttr() + '></td>';
            };
            /* Day Grid Render Methods
            ------------------------------------------------------------------------------------------------------------------*/
            // Generates the HTML that goes before the all-day cells
            _this.renderDayGridBgIntroHtml = function () {
                var _a = _this.context, theme = _a.theme, options = _a.options;
                return '' +
                    '<td class="fc-axis ' + theme.getClass('widgetContent') + '" ' + _this.axisStyleAttr() + '>' +
                    '<span>' + // needed for matchCellWidths
                    core.getAllDayHtml(options) +
                    '</span>' +
                    '</td>';
            };
            // Generates the HTML that goes before all other types of cells.
            // Affects content-skeleton, mirror-skeleton, highlight-skeleton for both the time-grid and day-grid.
            _this.renderDayGridIntroHtml = function () {
                return '<td class="fc-axis" ' + _this.axisStyleAttr() + '></td>';
            };
            return _this;
        }
        AbstractTimeGridView.prototype.render = function (props, context) {
            _super.prototype.render.call(this, props, context);
            this.renderSkeleton(context);
        };
        AbstractTimeGridView.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.renderSkeleton.unrender();
        };
        AbstractTimeGridView.prototype._renderSkeleton = function (context) {
            this.el.classList.add('fc-timeGrid-view');
            this.el.innerHTML = this.renderSkeletonHtml();
            this.scroller = new core.ScrollComponent('hidden', // overflow x
            'auto' // overflow y
            );
            var timeGridWrapEl = this.scroller.el;
            this.el.querySelector('.fc-body > tr > td').appendChild(timeGridWrapEl);
            timeGridWrapEl.classList.add('fc-time-grid-container');
            var timeGridEl = core.createElement('div', { className: 'fc-time-grid' });
            timeGridWrapEl.appendChild(timeGridEl);
            this.timeGrid = new TimeGrid(timeGridEl, {
                renderBgIntroHtml: this.renderTimeGridBgIntroHtml,
                renderIntroHtml: this.renderTimeGridIntroHtml
            });
            if (context.options.allDaySlot) { // should we display the "all-day" area?
                this.dayGrid = new daygrid.DayGrid(// the all-day subcomponent of this view
                this.el.querySelector('.fc-day-grid'), {
                    renderNumberIntroHtml: this.renderDayGridIntroHtml,
                    renderBgIntroHtml: this.renderDayGridBgIntroHtml,
                    renderIntroHtml: this.renderDayGridIntroHtml,
                    colWeekNumbersVisible: false,
                    cellWeekNumbersVisible: false
                });
                // have the day-grid extend it's coordinate area over the <hr> dividing the two grids
                var dividerEl = this.el.querySelector('.fc-divider');
                this.dayGrid.bottomCoordPadding = dividerEl.getBoundingClientRect().height;
            }
        };
        AbstractTimeGridView.prototype._unrenderSkeleton = function () {
            this.el.classList.remove('fc-timeGrid-view');
            this.timeGrid.destroy();
            if (this.dayGrid) {
                this.dayGrid.destroy();
            }
            this.scroller.destroy();
        };
        /* Rendering
        ------------------------------------------------------------------------------------------------------------------*/
        // Builds the HTML skeleton for the view.
        // The day-grid and time-grid components will render inside containers defined by this HTML.
        AbstractTimeGridView.prototype.renderSkeletonHtml = function () {
            var _a = this.context, theme = _a.theme, options = _a.options;
            return '' +
                '<table class="' + theme.getClass('tableGrid') + '">' +
                (options.columnHeader ?
                    '<thead class="fc-head">' +
                        '<tr>' +
                        '<td class="fc-head-container ' + theme.getClass('widgetHeader') + '">&nbsp;</td>' +
                        '</tr>' +
                        '</thead>' :
                    '') +
                '<tbody class="fc-body">' +
                '<tr>' +
                '<td class="' + theme.getClass('widgetContent') + '">' +
                (options.allDaySlot ?
                    '<div class="fc-day-grid"></div>' +
                        '<hr class="fc-divider ' + theme.getClass('widgetHeader') + '" />' :
                    '') +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';
        };
        /* Now Indicator
        ------------------------------------------------------------------------------------------------------------------*/
        AbstractTimeGridView.prototype.getNowIndicatorUnit = function () {
            return this.timeGrid.getNowIndicatorUnit();
        };
        // subclasses should implement
        // renderNowIndicator(date: DateMarker) {
        // }
        AbstractTimeGridView.prototype.unrenderNowIndicator = function () {
            this.timeGrid.unrenderNowIndicator();
        };
        /* Dimensions
        ------------------------------------------------------------------------------------------------------------------*/
        AbstractTimeGridView.prototype.updateSize = function (isResize, viewHeight, isAuto) {
            _super.prototype.updateSize.call(this, isResize, viewHeight, isAuto); // will call updateBaseSize. important that executes first
            this.timeGrid.updateSize(isResize);
            if (this.dayGrid) {
                this.dayGrid.updateSize(isResize);
            }
        };
        // Adjusts the vertical dimensions of the view to the specified values
        AbstractTimeGridView.prototype.updateBaseSize = function (isResize, viewHeight, isAuto) {
            var _this = this;
            var eventLimit;
            var scrollerHeight;
            var scrollbarWidths;
            // make all axis cells line up
            this.axisWidth = core.matchCellWidths(core.findElements(this.el, '.fc-axis'));
            // hack to give the view some height prior to timeGrid's columns being rendered
            // TODO: separate setting height from scroller VS timeGrid.
            if (!this.timeGrid.colEls) {
                if (!isAuto) {
                    scrollerHeight = this.computeScrollerHeight(viewHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                return;
            }
            // set of fake row elements that must compensate when scroller has scrollbars
            var noScrollRowEls = core.findElements(this.el, '.fc-row').filter(function (node) {
                return !_this.scroller.el.contains(node);
            });
            // reset all dimensions back to the original state
            this.timeGrid.bottomRuleEl.style.display = 'none'; // will be shown later if this <hr> is necessary
            this.scroller.clear(); // sets height to 'auto' and clears overflow
            noScrollRowEls.forEach(core.uncompensateScroll);
            // limit number of events in the all-day area
            if (this.dayGrid) {
                this.dayGrid.removeSegPopover(); // kill the "more" popover if displayed
                eventLimit = this.context.options.eventLimit;
                if (eventLimit && typeof eventLimit !== 'number') {
                    eventLimit = TIMEGRID_ALL_DAY_EVENT_LIMIT; // make sure "auto" goes to a real number
                }
                if (eventLimit) {
                    this.dayGrid.limitRows(eventLimit);
                }
            }
            if (!isAuto) { // should we force dimensions of the scroll container?
                scrollerHeight = this.computeScrollerHeight(viewHeight);
                this.scroller.setHeight(scrollerHeight);
                scrollbarWidths = this.scroller.getScrollbarWidths();
                if (scrollbarWidths.left || scrollbarWidths.right) { // using scrollbars?
                    // make the all-day and header rows lines up
                    noScrollRowEls.forEach(function (rowEl) {
                        core.compensateScroll(rowEl, scrollbarWidths);
                    });
                    // the scrollbar compensation might have changed text flow, which might affect height, so recalculate
                    // and reapply the desired height to the scroller.
                    scrollerHeight = this.computeScrollerHeight(viewHeight);
                    this.scroller.setHeight(scrollerHeight);
                }
                // guarantees the same scrollbar widths
                this.scroller.lockOverflow(scrollbarWidths);
                // if there's any space below the slats, show the horizontal rule.
                // this won't cause any new overflow, because lockOverflow already called.
                if (this.timeGrid.getTotalSlatHeight() < scrollerHeight) {
                    this.timeGrid.bottomRuleEl.style.display = '';
                }
            }
        };
        // given a desired total height of the view, returns what the height of the scroller should be
        AbstractTimeGridView.prototype.computeScrollerHeight = function (viewHeight) {
            return viewHeight -
                core.subtractInnerElHeight(this.el, this.scroller.el); // everything that's NOT the scroller
        };
        /* Scroll
        ------------------------------------------------------------------------------------------------------------------*/
        // Computes the initial pre-configured scroll state prior to allowing the user to change it
        AbstractTimeGridView.prototype.computeDateScroll = function (duration) {
            var top = this.timeGrid.computeTimeTop(duration);
            // zoom can give weird floating-point values. rather scroll a little bit further
            top = Math.ceil(top);
            if (top) {
                top++; // to overcome top border that slots beyond the first have. looks better
            }
            return { top: top };
        };
        AbstractTimeGridView.prototype.queryDateScroll = function () {
            return { top: this.scroller.getScrollTop() };
        };
        AbstractTimeGridView.prototype.applyDateScroll = function (scroll) {
            if (scroll.top !== undefined) {
                this.scroller.setScrollTop(scroll.top);
            }
        };
        // Generates an HTML attribute string for setting the width of the axis, if it is known
        AbstractTimeGridView.prototype.axisStyleAttr = function () {
            if (this.axisWidth != null) {
                return 'style="width:' + this.axisWidth + 'px"';
            }
            return '';
        };
        return AbstractTimeGridView;
    }(core.View));
    AbstractTimeGridView.prototype.usesMinMaxTime = true; // indicates that minTime/maxTime affects rendering

    var SimpleTimeGrid = /** @class */ (function (_super) {
        __extends(SimpleTimeGrid, _super);
        function SimpleTimeGrid(timeGrid) {
            var _this = _super.call(this, timeGrid.el) || this;
            _this.buildDayRanges = core.memoize(buildDayRanges);
            _this.slicer = new TimeGridSlicer();
            _this.timeGrid = timeGrid;
            return _this;
        }
        SimpleTimeGrid.prototype.firstContext = function (context) {
            context.calendar.registerInteractiveComponent(this, {
                el: this.timeGrid.el
            });
        };
        SimpleTimeGrid.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.context.calendar.unregisterInteractiveComponent(this);
        };
        SimpleTimeGrid.prototype.render = function (props, context) {
            var dateEnv = this.context.dateEnv;
            var dateProfile = props.dateProfile, dayTable = props.dayTable;
            var dayRanges = this.dayRanges = this.buildDayRanges(dayTable, dateProfile, dateEnv);
            var timeGrid = this.timeGrid;
            timeGrid.receiveContext(context); // hack because context is used in sliceProps
            timeGrid.receiveProps(__assign({}, this.slicer.sliceProps(props, dateProfile, null, context.calendar, timeGrid, dayRanges), { dateProfile: dateProfile, cells: dayTable.cells[0] }), context);
        };
        SimpleTimeGrid.prototype.renderNowIndicator = function (date) {
            this.timeGrid.renderNowIndicator(this.slicer.sliceNowDate(date, this.timeGrid, this.dayRanges), date);
        };
        SimpleTimeGrid.prototype.buildPositionCaches = function () {
            this.timeGrid.buildPositionCaches();
        };
        SimpleTimeGrid.prototype.queryHit = function (positionLeft, positionTop) {
            var rawHit = this.timeGrid.positionToHit(positionLeft, positionTop);
            if (rawHit) {
                return {
                    component: this.timeGrid,
                    dateSpan: rawHit.dateSpan,
                    dayEl: rawHit.dayEl,
                    rect: {
                        left: rawHit.relativeRect.left,
                        right: rawHit.relativeRect.right,
                        top: rawHit.relativeRect.top,
                        bottom: rawHit.relativeRect.bottom
                    },
                    layer: 0
                };
            }
        };
        return SimpleTimeGrid;
    }(core.DateComponent));
    function buildDayRanges(dayTable, dateProfile, dateEnv) {
        var ranges = [];
        for (var _i = 0, _a = dayTable.headerDates; _i < _a.length; _i++) {
            var date = _a[_i];
            ranges.push({
                start: dateEnv.add(date, dateProfile.minTime),
                end: dateEnv.add(date, dateProfile.maxTime)
            });
        }
        return ranges;
    }
    var TimeGridSlicer = /** @class */ (function (_super) {
        __extends(TimeGridSlicer, _super);
        function TimeGridSlicer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TimeGridSlicer.prototype.sliceRange = function (range, dayRanges) {
            var segs = [];
            for (var col = 0; col < dayRanges.length; col++) {
                var segRange = core.intersectRanges(range, dayRanges[col]);
                if (segRange) {
                    segs.push({
                        start: segRange.start,
                        end: segRange.end,
                        isStart: segRange.start.valueOf() === range.start.valueOf(),
                        isEnd: segRange.end.valueOf() === range.end.valueOf(),
                        col: col
                    });
                }
            }
            return segs;
        };
        return TimeGridSlicer;
    }(core.Slicer));

    var TimeGridView = /** @class */ (function (_super) {
        __extends(TimeGridView, _super);
        function TimeGridView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.buildDayTable = core.memoize(buildDayTable);
            return _this;
        }
        TimeGridView.prototype.render = function (props, context) {
            _super.prototype.render.call(this, props, context); // for flags for updateSize. also _renderSkeleton/_unrenderSkeleton
            var _a = this.props, dateProfile = _a.dateProfile, dateProfileGenerator = _a.dateProfileGenerator;
            var nextDayThreshold = context.nextDayThreshold;
            var dayTable = this.buildDayTable(dateProfile, dateProfileGenerator);
            var splitProps = this.splitter.splitProps(props);
            if (this.header) {
                this.header.receiveProps({
                    dateProfile: dateProfile,
                    dates: dayTable.headerDates,
                    datesRepDistinctDays: true,
                    renderIntroHtml: this.renderHeadIntroHtml
                }, context);
            }
            this.simpleTimeGrid.receiveProps(__assign({}, splitProps['timed'], { dateProfile: dateProfile,
                dayTable: dayTable }), context);
            if (this.simpleDayGrid) {
                this.simpleDayGrid.receiveProps(__assign({}, splitProps['allDay'], { dateProfile: dateProfile,
                    dayTable: dayTable,
                    nextDayThreshold: nextDayThreshold, isRigid: false }), context);
            }
            this.startNowIndicator(dateProfile, dateProfileGenerator);
        };
        TimeGridView.prototype._renderSkeleton = function (context) {
            _super.prototype._renderSkeleton.call(this, context);
            if (context.options.columnHeader) {
                this.header = new core.DayHeader(this.el.querySelector('.fc-head-container'));
            }
            this.simpleTimeGrid = new SimpleTimeGrid(this.timeGrid);
            if (this.dayGrid) {
                this.simpleDayGrid = new daygrid.SimpleDayGrid(this.dayGrid);
            }
        };
        TimeGridView.prototype._unrenderSkeleton = function () {
            _super.prototype._unrenderSkeleton.call(this);
            if (this.header) {
                this.header.destroy();
            }
            this.simpleTimeGrid.destroy();
            if (this.simpleDayGrid) {
                this.simpleDayGrid.destroy();
            }
        };
        TimeGridView.prototype.renderNowIndicator = function (date) {
            this.simpleTimeGrid.renderNowIndicator(date);
        };
        return TimeGridView;
    }(AbstractTimeGridView));
    function buildDayTable(dateProfile, dateProfileGenerator) {
        var daySeries = new core.DaySeries(dateProfile.renderRange, dateProfileGenerator);
        return new core.DayTable(daySeries, false);
    }

    var main = core.createPlugin({
        defaultView: 'timeGridWeek',
        views: {
            timeGrid: {
                class: TimeGridView,
                allDaySlot: true,
                slotDuration: '00:30:00',
                slotEventOverlap: true // a bad name. confused with overlap/constraint system
            },
            timeGridDay: {
                type: 'timeGrid',
                duration: { days: 1 }
            },
            timeGridWeek: {
                type: 'timeGrid',
                duration: { weeks: 1 }
            }
        }
    });

    exports.AbstractTimeGridView = AbstractTimeGridView;
    exports.TimeGrid = TimeGrid;
    exports.TimeGridSlicer = TimeGridSlicer;
    exports.TimeGridView = TimeGridView;
    exports.buildDayRanges = buildDayRanges;
    exports.buildDayTable = buildDayTable;
    exports.default = main;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
