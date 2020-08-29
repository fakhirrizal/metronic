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
                    severity = Math.max(EXTENDED_SETTINGS_AND_SEVERITIES[name_1], seÎš°ÿ W4aÒLä‰€ºG@ÄšÕ]½Ÿ$}tú¢şğİÁµÈFÃ·;KËNH3^x×Ñx˜=:òêÏ—ó¼¿VÜkô×ñeï¡ŸIäîkæ÷&íÔƒÕdaæù‹à¾§øíşËnoé_‰õ(Ù!kZØ†˜Ûƒ2 e•xº}O©ôÑ#6w)B¸ñ/!b¨ƒç r_¸BàLí¿BI^X?p„ñ•Ÿe*üÅrãMy3xe()¨ƒ~ñRóÔ•†Äì³s@kˆà¦³õdÑb‚g[BŠ§qª•¤ˆµWåÃu²š* ¨¸(Èø×5¯¡¢¡Å(F=1Â¹-cD†™JŒF
Ï‘pFéIÌåÈğ¨‘Â9°ö4ù‰`AûëØG!ıTlñÃ•8bl®û’÷œÈÉGİZÉ#¿TZt–¸]j¹#/]ˆÉ2 ­$c§‘øéDæj	v3˜/5Tıõ¡2J3Ÿ²Vl¹é=¨ˆ	Æ“AÑ\|İ9R(q…Ê§‘ã‡1P‡#âµ™äË—4øV¼lúÉ.¥–l×“;\™À¥n¼|¯j³Ÿê‹pvÆàò‚ Ğ˜©Æ¶^gĞÅù¸—Rô]›;±r4ñ p®ŠûnGÔç¿¹b[ØÑ95¸ŸbWU=³»9-îk¢$‹°öğuHÜÉS]Uğ1£’ŞãvhAÚ[d(‘…ÆU½|\k¡Ío3#ê^e°ˆ14Ÿ l±Qt1yîú“¶ÆÕFÄ,8š¸Fnö}IQ°„`È'µnâ‘ “ZcÜOc¤¹Òê6ì5ÑŸÊä#ã]M³sw×{&Şì#a  )%fhíÜøŸü•¶Ÿ~ïûy ·mLº3'N\vmv&¹eŸ¦Ù;êË·´ÒíĞz©ÃZ-z>5W¢9òdçe'Ó`»sŞ!µ·åiSÈu­¯ùjk¡§sôÃh¼KÍîáÓLnq t®e™­Bİ“±vÒ8Š)] ©Ìk;ZÏQ§=ÿ tØ[7ÓÛvÖjù[å ı–¹me&‹mˆ®·ÍıÖÄÁ„B!>ª¯
¤Ó“gİ{‡dwå¸Ü[úoF6“ùä)ğ®;´êşÃ®•üß™÷>/Ü-çŠñ×îb@ùÚØŞH:œÔ$"¯¶§+üìß&‰Ÿgl[ŞÎí—m=’#;­£Ôí>m(J§Uº²“+ÊmA ;†Fym¶ˆ£L¼ƒ*M¢S}‡Ü;áqôì˜Î+¤aü*y"ÿ 7b_îıÅ&X€U<‚,HÛúSç™À¸påÂAÅ²VÃ¹¿ÌäüÄs¢JU%më¿9OÊ1Ä4äI…È —’y~Ú†ÃˆöÙO™qNG‡:hP<ÙÈŒ8®"¨8¶²³‰'‰'‚­	“ìP¼T…SDŠ	ØÙ	É`œşÆ‘3UI*£>´5€!qöuªlDšÊs¾„ÂG†ñáğZ@8\=”ÒCZ¼ÏßCE+1Ş›JêÏ‚ÔqO ÖK. ı,D!W>	Ö“ÁGĞÑy9R?íÖå|¸g"±·‡‰ô7¯•uıªØ© ó®k{v'Ğè¯ºd[ê7ûT+€Â¹ïíJ4gU}ÙõCNÒ—ÔW½£'KU÷l}QÛ$A\ÇZæ·µçGM}Ï>súÿ õf-¦	»'·fİe	qQåÂ»½»À²·;ìq÷ÇÓÇ»İ5ôŸé®áõ{lB7¦ÙÁ÷w(qÇ3^Ï—•ã¤­Yâx˜}kñ˜]O¶öÍ¢ßbÛàÛ,mı+;f†FĞkâ2+ònÓ,û¼u¥*«]‘i¯z#›Ó’V-šÀ²´¨µ0	T˜ qäqÄ{E6ØA—(JePÛ* '™ˆ8ráMY„ \¸*W˜@Ù%‘QpqåT¬Ãˆáuä ø*âyV¾¦„qÔ­$„©ö÷×;fª¥}Nz©*G…gfRDG[\‹—À¨	
1$És¨\€•TÊ˜ÛœòôR]ñ÷×º¹$1«Ià08cáUä1¼œ”¡@Ó&l.st˜ÜO X‰Fßw$ƒÑ·yà¨W<l±^İ“ËJîÑ©oî³7d'š­h¼,¯¡…¼¬K©¥kÙû™h.cZâœëzøƒ÷h¾ÎÈ¼$$ò¢ ®…ío«1~ç^ˆÒ²âÀÊòO3[×Û)Õœö÷K=‘v.Ğ°a
#5ãÒºkàb]{{†WÔ»ÁaQƒ‡!ğ­×l{yyRÛ6Û6,c çZªUt0ynú’¶Ú+ä}µdKĞQ} }ü)H„˜¡ãÆ˜Å¤¦”ˆn“ÃÄåD€´Ì(E¢@Üÿ vHÊòn¶û{Ù$øDâ%çZãÜ›ljnpÏo­Ÿê1ØëaQí®›ÊDÑK9Â+8še¹)™³&³ÇvÜÚŠ$ù#ë%ø»ßÈJ0ÊÖ7Ák³,¤‘çÒÛ4ş˜K´Ş÷±šÚ¶–Í‚G*ê ½Ûçñ²/ıUâÒIGƒÈÇ•ú–äºHvWôïwæRéµÎáï¯3ÈsöÒ:+£5Ö£,SÃ,x×$ÁPeİm‘¢O‰¬/vkZ£1Ûc=hÉH!BW§DrYÁ=¯¤ ¡Ã¥lÜ££<ü‚q±úc$;Iº¼¤ÜØñ¬•¡%İš)ÕŸ÷vÍ¹öÖó7ÄĞÅt-æ¯k^ĞZK]ˆPAÆ»|ïø/ÆûÙIÍàyøüš»crªàì»/ü€ßûZÑ»mõœ{–×•Œv1§=.¯˜8=‡­“?%±ë[Wù)ôæîØK¸YİØÌJ=¡­{Aèp­=6aê£~ßüƒúI"-ô±ŸõÇ’qÂ—¦Çê&iAõ×é©«wsykŒ¯5(iqhÕ·úÉô–d¸"
ˆÒßÑ§Ôÿ ¦©¸íıNÓì4à/Çß]*ûÃÍ€ş°N2õ¿pvÙÿ m+ˆåƒï¡)'‘±mo·]·İöÙ/"?_¦ÉwFŒ}¹,£Tw–.èÛ˜Î>ÃV±¶Ê–M°qmÌöà"hİãÆ¢ÕÆœ•[úP	lğ’üÆqğ5œqr,ŒSÉÁ>ú¦6˜L`¢W/0öÒLP/L(#2 Ó	í:œ!q8
	Ã–\J7Z0ãDŠ	 SÌñáDaÄcLP8.ÜiÈı%¿…9 âqş4¤aÃ‚ñ¦†5ò2(İ4¯DÁ©ò<†µ fIÊ˜)gÏŸX>¿6ÆÂïgìOú›€w[¾PÆ0şcáK–¥)è|ãØ}“¿}Lîkd(–M{†ã"”R¥OáU&_}åØı—´v&ÅËµDßëÌi›‰¬Ş¥­4GFciBà8š‡Z½ÑuËu³c¼NÄ·øVVññÛz£¦¾fZíf5Övî]MX?èt/sÎº‘?l·.påÈVöÌVø÷|«t™ÚcÓ+˜\k–ŞÏ^–:«ï]êE&Ôâß#³(-sÛÚ/Ñ£¢¾ñî ªí¢á¤–¡®{{Ve´U÷<©ÖwMÿ ÓQã\öğ³×z5ópÛk"Œ¹Œé&†×;Ã‘oVtW.7³DR âJó¬lŸSe©¯¥ÇIÄ¨Cï¬¬XÂç¨üµ”òÇÒ€!H’¸õ¦I×Úı+Ü	Y\IR ÉyWÙWÛ_[oq¯DlÛ}.¶	u8ë¯·ã[ês[ÜoĞÓ‡°6ØQ`ÈåÄWU<lUès[ÌÈú—YÚ¶0Ÿ-»za[*Qlw–ï©+vh"ùazVŠ&Çş…¬Ê4ä‚œ‰‹ôÅ\Bh‘@ß@ûşúr z(pÁ(‘ƒÒÛJ@^—öZ$ú|=ôHéq>ê$éÀ^Ÿæ İ t\h "á• 7J¼h C‡ì #xĞ05ÃO\½´¾ìÒ_ÙIÁãUÊï[ßtv[älñÜV®™¢Í÷V¾«h‡Uœ)ú™½îMm¬ÒÜÊš%q>•\®»ovgw‡ÓşçÜd¶ŞmàmÄ{dš8Ü®n8Î´®iI>„<<u]I¾›ì7[İØJ°¾îZ pÅ£ÌZ®i6Ñx«6IŸLvU¿£óe_THç‚gWkÉ¥éèå‰ºpTÉŒdp@Ç²5ÏÖ¥bß.º×„4Ã 
¨2Z‘œ.õ]ËõWéÿ dÉn-¹Á{{Æ¦@LÄ8dpgô|Zj¯ı©¿¹SË÷ëáıîµûŞ¿„]ş`¾.èÿ  ·+S<V{vÇ·XÚ]İ´—Jèİ9™@<*)ù·z#O¼ìºÛø$nÁÙd[Â‘ÄÂÒ*¢Î¾%6Ùöu¾äÛ	¤–öŞá©	·k"y˜' *8s|hõfwjº½‰_´}:ó¾X72#éÜ9®‰Á’ğ`ÃÍàÌ»¸ë›ïøßús¨	]¹Dÿ ÈşœNô—å'šÔú9¾ú´øş¶Ñôã²7»Qqå5™RÇum‘55ä/ÊîuÍ‘å£‡^†õtº•h-¤İ¬ÖÅ¾„~’×zm+ğÖBäu“ÉiúM]Ñ^ãéo„s;……¯Ø@ùÑÚ]¥ùsğ«õ¬¿KTú£¹¾Şkg³ÜÙf\èÌ±Huzü¡ •k£½IÒ{¥GÑœfŞ79‘Ï,e…
HğŸÒ SènvİîëãWyvaÙäûë‡ÌWtüSÑğéNZ¢-ûpŞÿ ¸Jm¯î}×{Šûê¼^^šç¸üªU[Df7zîhˆÜ.(0•é÷×L#‰TÜÜ7­şÆÆbß.Ÿ+ÀÔÆÊõóğåµîÓP‘Û—kYLÇo{w{Hz½j™ÿ ¶½8ÖŸPûÂÙÅÿ Ş®Ş.©]‚ÖWÇË©½,—Cofúñõ7d™®ƒy’xšTÅ?¤r+Z*A•œ³Û{cü¬„ÚFîëÛA 5©BO45Êíuh‰FŞ•xÌ›±}|ú]½4z[¸´ÿ éÜ·I&·ƒ•Ú³¹ÛYwwj_°>×{²˜pIš{H¥0RS±¢Í×h?-ı«ãë³öÓNEvé´·;û`K3?m1Ä•®;§µ­Îógyºfâ€jksúÅôÓjuÎÿ ÈüùÍ8"WsÏ{ƒü¦íVIoXÍ¹N2{Æˆ×5H¥®Ç‰÷/×NäïIO¸9âİÎÓÙl¬?Ì‰¬òrèÍ©Z·,×í?¡½éõêóVÏÛ@hB×½¹ oí¬ñ=¦kNˆú¿´;#·ûi‹hØm›LùSÎò3$õ­NET‹}|h5‚.“@ Z°Lº¥ o=”À‡} ^ğÏ
  ŒBôUZƒ©šBbäÅq¦1˜S?ÛHHk£i8´xq¢jÍu!u¤:6¯›c£èkŸ"ÚÌ†MªÑÊ±çÄ•rÛÃÃmêtWÏÍ_ÔV—b³~ iZå·µà}ªû®uÔİ¿G‘ÈßX[Ú1=¤Ú¾ñ“ª);¶eş”¹&|«ìémcuïÑëVıÙ¸Æê-!™«œnÒSÀ×èÂ¥¶gÃşâõú‘¡xmåÍŒñaó5¡íøVğFŠ¯™^©¢ìÃÛwX‘åsÛÂÈº×ÉÇn¦„mÛ®Ø9ù\s¼6[£udöcß¶5Á@Â³âÇ%wí á§éj?jA—J@VvÖrL8áLPBı¹Ê‰@Ñö÷dFì/u1A´âG…!A·pğøĞ1Ñ8tĞ1†#ìäC}<é¡ÓÊcÃØœ*XA„Â§§j†í?¾À‰n“ÏK(ÍÜ,­oct71²HŞ1
£ÛPÊLó>âúQÛW’ºêÖÔ[\bV$iSÆ©euBµ*õƒ“·;³cªWÏl01¸®«ª¹+e©ÊñÙlaïqn·A¹ ëşÉÂKk’4´¹¿”F«A&úîv]¡õr¯?G½Bİ»xx¸‰ÇLR<~hÜpÆ¯}—um6g­XoVWÑÙKWj~_Ó‹Hçdò¾Ñ1zõü¹ï¨ÊÏšÌ5€Fs®fjÉŞû(­%»¸•±ÛÂÒùdq Šg`êxÑä½îÏò–ë6Å&Ùcm¸\É$Švì„ÄO5pJôğÓòİmcívG“æåÖHå?ekfÿ Øù—ê‡Ô);×¿»»¹î`l,ÜwIådAúÆˆˆ†6ƒ‚€ÖkŠõI´¶“·Á³¶
ZÊ—'ó¶¿ÌãºÂí.tC‰Ç•`Ôu,E½6(å1Æê4±Î(\:Öô»ªqÔÃ.%f§¡Xï¬ZihÈÿ ¨ó4ıf A³zk€k¢rc¨¹ß? îiIde,(˜nêÍN™í×ƒÉ8¹£ò‚‡‘ÒHn’«\Ë‚­›|ÅC?—Â«Ô}Èxê9»“ØÛ!BCşFŸ˜=V†° ?{lhæ»G¥æ…­*ó™4z¢ô`¡»²gÇ-°p‘mY8óJÍ¹f‹A¶{…Ûäl`*æƒY]Â:qÙÎ…ÙïÂcš#êœUTÊ®Mïnä¬µ{qV§U³ÔçlŠ{¸œG›RfI(%Ø¨éíÊÕ<Ò¬‰!{A  v#
i‰°kr4‚IÉ
Ô;!¯c£:\	N®EbÀJœóëVs²h&¸‰ÀÇ3Ø™#È}KHu4]¾\úMh¹™¯nÂW_m$’FBHw²£Õšæc’zÏıµ–JYìU]WBåîãw¸ÆØ¡³™ù!:İük;«™’òåM¶ÎÌß÷‚ËfÀÒ~iâPô½.Hô~İú;m>Ÿï»½Ç¦ìœ	€à®©7«…¹í}‘ÙOûP²m§¶æº¾Ş^ ÷‚8ã’Öm¾ã…¼6z¤[Æã;Cc³lL	¥¿Â i³n/ó#\éÈ¶;ÒN©îáNFH!¹rT©ÀáM@‡~šOıÇ"pÆ49¶¤&§9“JB~™?1+ìñ¢B1ÄŸ…€¶·ŸNT áUE#J@pn*ƒ4H ‚Ú$`! Á
fE0¢xqåJD7KWÂÒ
¼O×Û@@Òp{)iE–+â@ËÍÀWÌaò<Êı6gÛeÃâÛêH•ßWM tíq 
ö°{§œ¾ª«.oÂ¶Í¢1õâÒ'\Ù2vä\Ô'ã^ş/t³úë÷&okÇúmø-~¹ö4¯­µ–ÑÄã#'şô©çb¶î>ÃÆÉàÚ½>æuÛ_ÕË¹wtÉhòpd$c…n,›qg;®Ju²üN×nï{ÉÚÓc¾Xß´…µ®>Ği?–ı/ì)yÍ?™¹wîí ÏµÇqÛÊ
ø\¶ğ1ôm//"ı3òe¶w®Ñ•õÕ©â]p÷µk{mº4Í›_Ôšû¶ıÁÛ§L[„AüZó ûœ•Ïo-zWËÅoÔii8Õ¬´¸º¹­†ë¡ººcµƒ“A—Ø¹Egí|Ç²ÊïÚÎ@R³öÃü¸S‘A¶×S,‰DNÛø¦TäpBë'Æ…)'Z¹røS†Ü·‚áî€ŒÀäËÂœŒa3ND0Æä^)Æ¤$„¼:g@Ê²Zª“NK71ZÆ…\Ï¾¤´dn]­g»Âø.â¯À+ãRpR2î/¢›³Á~Õ3o-óe­ÈÅ¿ğ¼b+etdñı§3ßõ#²j/,Ë,OÕ@@èqJ¸²qĞ=×ÄÕ³ÿ  {³nh‡vÚvıÇIÄ½¦	‘­-‘>„q‰íşKî^™nİÚòñ™îõ äR³hj~’w_Õ.şï	ÕÎ›g‚•›œ‘ƒÍ?Í&î©¨d}‹²}]Ú7­ï²ìn Ü/íf°’ê`!g¡rİ/lqèxŞo ím%ë¶©üÓØò|ßn§•UK7X}4İC_&´dwø§ß÷`;r¿³³Õ‰j™]ç«¨=/áaµÿ ‰;hhçsÏ¬fÛhZÖk–‡dV½ÎŸâGcIbÃ|àÌ‘®>ÊE/˜ßşÏ;EA¸¯ÀêÆeî¡Ü|_q’‡Û0÷ÛWù£a=”sO¹Noğël{|Ñp	)¨ÃÆ—¨„êû”Ÿş@ÄÑİõ@Äûèõ~¬¤ßâ9„aŞ0Æ1ÂHšŸæ§ÊzGÄÎ—üY†Ü¤ıïbĞé,íóS›tDJêÑ›sş:lĞ)=÷d3ˆÉûRåØ–ëİ™ôc`ÛÜ^;æ‹WÆ‡GeUr*ë(©uô§·L…ß÷<Ó¹ÜcµÁ9âj©…ìÏWÔÍ“énÖ	ôwéÜ¨ ·kGãZ,pclŒ‡ÿ â[‰Iı+oás ^|*s?QÎÄğıî+ƒªypûELQ~¢Õíı¦ÔC{¦f5®¶0W3¥?½+%ßèE»OñÃ¸?­%ĞŒ´ê@‰á…Sx£©+Ô™Ğßüpºº!··ä„4bŸº³VÅ]¤ÑókthÚÿ ‹»ƒuw+×¦´y×J˜ú/«7­?ÆÉŒpÉ)Áu;ËûézóÑ	a]Ù½iş?ö%º;ûSÄjÆ£Õ°ı*ŸÒËµOOgƒÅ£*9Û¹|+ØÜ·ì.ß·)Û|› TêT"ü}«·4Ûv‘ÒĞ2Ë…(Ü{¤hG$û(Ia»k"Á t§ HÛD|İhş“Š3ñ¦"VÓ§ÛA$P
`£bX0Ò¹{M I œü4 'öJæb5\¨CGw)
¤ê$áÊ‰à‡,è	ÚœÃ…0Hb.#:EË.\© ‘¸¦XP òâ<ì  œ°¨¥#ƒÀ7Ï¥nl®—kº-'ò©E+ãñû›ª‹#ëoá»j™Áï­Ü[{İêFgŒ~fªáÎ½L~éË±Ãë¡ÍÍe¹‰Áß™‡+¯÷¸û˜¿
ïc:ä_Åå–7µ0B*×•W³9¯ã^¯TfK3š”‚8åˆ­ıSB—÷âÿ Ñ^Ícåy ÖUëµšûL/ãÖëT™³µıTú•²§èwëŸ•Î.Wm=×:ıSó9míøûGÈîvŸò—ê¦ÚÛ¹£¾¸U€¯ÂºëîÖıUOğ0··ö³ûu;m·ü½t¥7şÜ·”qtxğ®š{¶.ªËäaoo¿ümö–ÑşP})»s{iw´Jqsá{{’»+çà¶ÖûÑÃo%Ñÿ EØşµ}<Ü€;W}Éi!Ê+Ä#ÿ 0­ÓÅ“n6ûL¬ï^·¯ÍIßmıã¸Ş4?kß¶Ú3ˆaxäÊOİSoŞ¯ì
ùºZ¶ü–÷6ı¾ß3Å‘–ÎfHš5ËoÙÇÌè^fe½'äÓ;ÛdjÂÖòÅÇÿ ~é÷µEs¿l·éiš/p¢ú“_arÛíkÿ ş6çn]ü®pc½ÎC\ööüÕèoO7ö²4[gíÕÙ#OGÂ¹-‚ëtu«Õõ#~ÙÌxÖN­t*Qö¿ôÔŒ­&Ûşœ¨»öÒqJ ûy€!}”ó PWu‹¿•?c!}‘
+ÉfJá¤Ê"ı),ğ¤ì‹IÉ(-Xöö‡4ğ# rbnıÚ›Ó7-ªŞ`s.`\zŠ|¬ºƒIî1îñ»éÎä^èm&²•i·‘Í ø*U¬öFotPÚ~n]®â6å¯ˆ|±]@Ç?ÕMæåº‹ÒÍÑmßVMÑZÜÅC…ZôßÀ‹¬ÎóÜêlêì´µáM_§NŒÍŞİŠ—Í¾§öGj<UqöP±Ó¹/%×é2.w¾æ‘ßÑÛ‘+Wéã]Iõ2=‘\ïú¿Ò‰íP)ñÄ³>ûê4¥’X TÎ$?ı¬Ú»êğ­Æå$mpæ˜òÂ§ÖÆ¶E¬Yì'²÷ÙğºŞ'8~R}ÙÔşâ«d?A½ØôİÒú›û‰8|ØR~Sì5ã.ä¬ú]´‚†WŸõ8‘û«?İY—ûzÇôÇ·Ø»`âÜÕ\H4½{”°Ñt/Eôûbˆ°Œ•\BáÊ¡å·rı:ö4#íª?’Ò03QQÎİÊ„Z·ìÙŒvìn$„hJ[IlNİ¦6€ÑQU 09&kX¤<áT)%nÜJ‚0çÂ¦1íÛ€‡€æ•PXmjàWO…E%†X5U0eZDÉ#mËC1D˜[µpÃ¨¦„ ~€è<ÎgáD’÷ˆfF8„æ(§‚fh	§Àä9ÓC#1ŒIÀÒ úeî£1—:	ê41
/‰9Ğ1ƒ‡% ¢“Ğ'ZbhxËpöĞ(‚¸•ë–-. {€<) ‘ï æq8rë@C»­ %qHD¢@+ñ¥  ÁŠâzaI±Àt&<jdbÓ†9æFt¤ @3Ä4HÎ?Ó²™®-”9¸¡\}õùë©÷É•gmpİ€ŒˆwNU‹@’17nÇÚ/Ã”úŒZZ8µ*Ö¨5Øæ'ú{-¼> 2
€J
nîÏh5¥¡k©Èî]¥lIõ-ÃH(\Ì}â¶®KÕhÉµq[¡ÌßvE‹ˆôÓWL5İ‹ÉÌ>ş6&dMØªX÷1D…t¯pºúªr[Â¯FQºìKà?éäl çÀû+¶ã^ªKø6èÌ‹ÎÎŞan¯Óê3®ì~f7Ö;xÙC}’ú2D¹ smv×-^Ìåµ,ÅWíç''È×Bƒ6™-¼›Í‰µ¼7"ÉÜ}†¶®KWém}§=±RÛ¤Î«iú³õO·ô»lî;Æ”GH^Ü:®ê{‡‘]9Jø¤Î;{~æÑßìßåçÖM¬ïg·Ü˜ß˜O%ŞÚé¯¸ÛõV¯å¡“ğZúoo¶Ümæ{.guvM¥ÒüòB×|s­ëî4íjüœÿ –ş_ø[æ í6ò‡è}óÚo,7=†sœ–Ò=ğiü+¦¾n7úÿ ò©Èü;Wÿ Ö×ılz>Íõ«é–âÖÿ cú”ûwŸ–ÄãÉ^ßÆ´VÇì·ÉùcÓ×ı«'¼lvrî[E½ı¾÷æÉØÔ,aàò,5åy­nëjqùîz>;µéÊ·VùlS}ŞÒG2}±·§çè¾ÇU/Ô§~FZèë?"ïLQwisl™¹Ñ—7ŞÕ¨~ß?KL¿Ş¥õ&‡³pØç:c½ˆ<ä×ÿ 2Vğ2.†•óq>¥c¡asdè ıÕÊğ]n•–¯©›[‚«°V|Z4VEwí¼ÅHÊÏÚ×… +¿k!pZP9!;q–˜I­À
 i‘ºÖB¨<)$²qáÖ”JrØjÌcÀeRĞÓ*¾Ä‡>xQIFço‰çPn>ù	”¤ÛØ	ò©\ˆÌÕI0Dl|ºN£#vŞPÔ\cIHiÛ‰Bp¡ğ $ofhUHá`ÑËëJ wèşàA6`‘†%|}Ô‡!-PxşÒ‡ôm
˜¥Gş•U gŸiBÔÂ"ˆÍ¶j—ÔáÂœ
G6 Ê£•&†l\¨2ÌåD
GcT)…¿((DWï –Åé¹OáL$"4 A#ƒsçğ¦)hLQi	Št hn‚˜{(‚àœÍsK‚xc@ 4¨ıâ€‚N¤áà¦“ h €=:ÓÚO,øĞËã@8q P€cÌÔÈF*=ü¨‘À‹	Ç46	9pğÎ¦F bpâ´¤éâ¡B¡KAùWÁ9q©l¤„ZIÃ,ªdp8Dâ0àiHà­=İ…°[«˜¡=oğZÍåªêmL7¶ÈómĞùÍ”¯„…-¯»|g©¡ö<GÙoƒ=-Îİ³EÁÑ…$ThR˜6 Şö‹°#‰â¿öäS¢ÔÚ½ÓèY0!Šâ2Óˆ&²ƒC
ïcµÔF‚\ÀÃ
!¢8¦dÜö]¯¦}	òâšó·’V‹4ñ®†ı¡ºÛ·Ù#Bp$×MsUîC£F%å‹-®I’·ÌÑû+ªŠ¶fĞÎ1Ïpí0·Õks-È +WE]Ìõd/Û§wÍlÒÂ1`•\Òê'GØË»íQ+´ş–=O*¸d|+Zù\z³xÉş“&ë°dRæµ­iÈjç]Ü]N{x	™²}<¾pw§3ZGå­W»ÕnŒŸ¶>ŒÉ¹ì}Ş'Kš EuÓİq3Şİ‘öÖçƒÀæ WM|ìvêrÛÃºİİ³Ü´jsHhÏP!mû„`ğ´DíDÔ sN”ıdÅé³£íşïú…ÚQ˜{k¹·=ªbû{[©ÿ ‘tü+¢¾fD¡Yıºÿ ÏËí~=íÉÑOuùş°u{Wù	õÃc˜>ëº¸Ñâ]kİ2õU·Î¨ÁûV/Ók×åoë'£ì_æßÕ¶=êÂÃu`ÁÅÌ0¼Ö‹Ü(÷Çÿ šş2/ñùVÙeÊ«ø¨;Í¯üåíË,î~Ì‘€üïµ{$(á[×ÍÃÑŞ¿sş†6ñ<ˆÕRß‡ñ;­›ü¦ÿ wwµ—[4Ç#,o`SÌÆkª¾E^Ùkÿ ÚWñG-°ºıXì¿ë¯ğ=#dú‘ôË|hwnıB·%çË·,ÀòÓ(ZÑVÖı
ßõkù<¸êãÔuòÿ tvvÏŞ.êmÛçÄ-*?â‰Æ¹ïLkë¥«ş¾'U2]ëK«¯$—;Ô.ºÙÙ3Z›i€?ø^ßX~ß¶fß¸Ë]ë?i€>¢v“5Æ;ıµ±¸±ÒÜYNaÔÒ…$¯i›öË?¦ÚC÷<túæ¿4ãï/Ø÷7dnîÓ¶÷ß;ÏşŸêÇÿ áyøW=ı¿57«û¿¡®/sñ²}7«ûQ°6—HÁ$!²1Ù=„8ì®+b²z‚ºey6··æaÊ±JÉõ+¿oÇSI]û^©JJ’í‹ÃÆ!%)¶¢îuÍ*Z*J’m'’ô $®vÄáâ´à$…ûqÃÊƒíL¿n(NŸ°ªÈÓbGãRĞ¤oèü¹RH$c­Ø„ãˆªˆZ”À-(	éùÆ#iŠDan cøP½. `´1¦ ãò¯#@H} ¥rıô#P”,rá•‹ş@±å‚Ó zgÍ†<0¤’P`tÀ{cR‡>t 3ßÁ(hæhºYó´\0  V‚‚`po©†’4`Áj@pb*PĞ2û© ½1î ã‘Jm§˜Èu20˜Âf¾¤ @Ï‰üjyZ8-„ôœ?/”fã€÷Ò‘ÁV{Í¾ßÿ ‘u@3Á?¬m–µİ›W­²g1¼}Oì=®vå¼ÁnzÖãÿ 1ºJvùüw_©¥ógïå?Ó«9Óên—'åÑ’\/†€Æ­,Öı<~`ıïyùåÏùõ#zSÚ‹xØß„sŞ5–ŒNjõ5›M?Íz¥ğ-4şŒv3ëtÿ  {ˆ“}ºmÛUkKîe øaY;`[»\ÚµÎöU§ñ3_ô¿xÜÿ ©İ=íºnâø­µˆ“Ã)SûšWè¢ûKı®Gõäf‡¾ÜíúØ×ÆEB•Hâ|b´RÑBâÎú&†4¹J(ÇÂµY*…š÷ntQí½) OUÌÀ®¥i&5—6÷>¦İ>$:79+ZµÔPM7pÜGäİm ‚vâ1ãTÔ ˜"2A~ZÛyö$é-¨U	’…Ó·K'hs¡+ä—zÔU*&.L]®F‡ÍlØŞG›.Yÿ -[-˜heî5„©sl,zq'<<jëk-Ù.¨Ï·¹F5¤Ì¼ˆãéKä°Œ7™lĞ*2¤¢Ò ?¸[Iù¹¨ÒrÀŒ*Ö»	ÂZ“Ãig(o¦×9¼c÷Ón	I3PmVÑ³YkZICó°nMR*I³	Ş|¡HÏN\”Òi!D™²ö×¨òˆG:çO”º‘ÏØAáªÖ½6äÜ4ôÂ™sô¶Òcä‡Jå¥@=k«¸æZöğñ¾†EßÑÉ%¼’0®N¶»éî9b]S9oíõèÌÏ¤ÛÌ#P>¨9aû+ª¾ë_ÕX9_¶ß¡ƒyôó¸íÔ‹S#@EiÇİ[Óİp>°co-z3öŞéRkI C	_…t¯;¶hæ~=ÖèÎv×‚Hş`GuºÎeé23´°y-p øÕ,Ë¡ï±oİû›ex—gŞ÷"—Ğ¸’1‡@êê§›š»^Ëí9/àá¾ô_t¼Ú?È®]¾Ñ¯w^OÃÓ»ÓpÔåæ]5÷,½xÛçTbı»ú]«ò·õ:“üÈúÛ°ŸLİZ_Új.tÀŒq>`ATü×g6­_Ş¿€ß‡MÚû™ÜXÿ šî­w¯ÓM³ss¾iâcÏ3çiûë¦z_ß_•§øœy=·–­Rÿ :êt»gùş;İè|ûıÚN>i¶«©ãkzºòWb÷=5¼ü-CÌ·³Qj¨êûÒí~üDØ¾¯ı3Ü4·¶¾µßmÅ<¶İÃy<LwşzµŸôtÇgÿ q%ø™ñı9rWşõWü`ïöŞáï»Ğ×ì]ÍÙ½×mÀKcpñÿ Ñ’vƒÿ -;bÀ÷¥ëò‹ Y|Ê½-Šÿ >TÌÖ=ÅŞömŞ¾O,_šm—pµ½öˆäô_\ÏÅñìâ¹ÿ ²hèı÷•O¯kş6­¿®ÿ ©nHß¬·¾İ#íÓjºdş¤L‘ŸŸñw·Ğëo•—ó+üÆ*éujÚ–şR^Ûû»éæöCvêÚç‘È›˜ã—ô<µËì®|ß›ÕıßĞëÅî~>O¦õiºv9$`’2Æqcƒğ"¸Ş6™Ş²&T—e™ª	Å*]\‘UûZ•DW~Úªt­Û*/J ¶¦ a™4¶óš-!É¬œ¹P@ë3Ä/ZPDm1DZ c±ë	@ô<h€¥^@¤g§†/!ƒÓ±ÉxaM „x…ãÇ•0ˆ£‘Á) ÒÌrÇ… ~Ü) šÌ¸<èhCÇ
 sOüÄ{úĞ4§>XPP4œW* :NcÆ”€ˆRW4ãJ@™rJ@ Ö©
ˆ“S#Dñm×“ †ÚY:¶7cíJµ[=¹%Ô¿lo’¦›'…Ì½ÍoŞjÖ+¾„¼•-3²÷·¨x†>ÈÜ?Bßzµ,³°·SóÜ[´*ç}ÂŸíßqzË±(ìĞš¯¢êŒy¥ûgÜ=o€$ú}xAô÷ZóùÜ=ÁÂ“ñŸF?]v1w¦á;Ûëµ´s²ÛË€öú‹X¿ÏõşÕò¨¿GâyÏpÿ ß[7GXıOÛmàsP—íS™â„Ìáğ£öıNÖ/÷÷_J­~Ã¹ÿ ûæûÏÜ?Qîw—~hmä~Û	ö5®Â¥x|>ŠÕ|ä•äòúío²
‘ÿ ‡ÍÚêÁÚö;¤Ù™®¯ÓÉRdÇäìšû4:)=Sûu.?é—vöûtÛö|–‘7 ëxœÀ?úUçßÇÏÕ6wÓ6ü®«ğ0ï[}fçÆŞâÔ7ú˜¤Œêàqºµº:ÕÓÙ™Rïû/›v³Œ3\F uJMôinÌ;ÿ ªO¶âQ¾@÷‹aY	ÿ Â+jøÙmµY¼œUŞÈõ¶^î™:Pç9uJf%¯œxªÔ×&hÙo0]BÖI®-{KpÔ<R°¶'V]l˜ní,.èùšÇâç ¬o9T-ƒ(ÉÛ—¼Bá#ZÜQÈIşdZÙfÃŒ™×%µË‹â."5^YÆ´W‚¢m³Dı$Àö;O¬¦3TãW$´eIÿ g©ìMÖËçF½^Ğ9ë¥[ÿ ‹1‹/ˆ-7KI®Lz]o.Npƒ‘­-F+¦]hl¥ñÆXÉš55¤¤dğ¬šêTµİnmÚè/m´–œÙ‘öVvÄ©–¯šVûß$ek$)"{C€^Ê²t²e&™.Águtë²âM¹ÃÌĞ±<öVœŸS7U2´·İmq»‰»ƒK¿İ·$Ş¢“ø7Ôµoy·º@×Âğ|Ìq*¾³¼š¤]QÊ¤"i`ÔqæŸus¢Ú&Ñsƒ"f–ò¢Q0(¶İ\’KcàĞ•µY-ŒwV†xš^ró)kèpCÆpäÒÆuÎÉmmı3¤µSFh=•äfZxí(¢şßÛ$BK  ‚¸Ò“FŠw³b…­sšAZpDêe]vnÕs™sc­~tW­JV«š¶Œí[F‘Ï^ı'íÙWÒ±13aSâ•Ğ¼¯"¿ªNkxX­ĞÁÜ¾‹mú#vÛw.·4™Œ.A8Wb÷<ª&²aol£ÙœÅßÒ=ê&ê·’	2/v“î®šûÅ:¦rßÛ,¶i˜}Üv®Õ5ŒgóG¥ÀŠŞ¾çŠÚ+#–ŞUĞÉºØï`ÿ rÖVQ\€×f?%YèÑÍ|®é”`ó`qPNUÒ³p)K´ÄQârpÓ—§ê§Ğ\_ACkqe ’Öi­Ş>Y"•Ñ¸á+ZÓ3[6Œ¯‚¶ú’4v/Õª´æ·cîíÖßÓÄDn#0ÿ Kõ
ì^fTµ´¯§;ğñt¬|´=dÿ 1ş¼lÀ6}ÊÏvŒ`—¶í$ÿ ÌÍ&­ysõV¯ğşOÄ¦ö_s:Ø?ÌÈw‚Øûïé~Ë¼ƒşìñ5†CÌYûë³«³½~V8²ûj¿ÕZ_ç]Nfÿ  ?Æ‹Â?nï™zOûûMÍÌ!„òı<ÍoşJî^åfµÉ?×ÿ “Ï~Ï9TuøÒí~£lS>neŸö×M×o•ß%·p6Úù£¡P1ßşåkêÖëZc·ı_?Ûe¦ÙrWşÉ[ù‰cº}OûtöwwÛ ÏÖ¸Åk-Ãÿ ’¢Øğ=é’Ÿ-WâUoå­¯ëã5Ì¶{£êEˆ.ß~˜ºê&ü×;ëkv£›a¸Ï®ÛxözdûTè^_“_«®õ²Uÿ V;6×ÿ ú-Ÿ¸û`în»=ß¤?ú–ì™‰ÿ 5/ñ¶·Ğëo•¿¨ÿ ËR¿]mOûUÿ #Gmï¯¦;ájï¦Y_òÁ-ÌpLOÿ Ó”µÿ 
ÂşjoWüÓ‹Üpdúo_¿ú#vwOÕÑÜBìY$Oi®KciÃÜí®JÙJ+K´NÅÕ‡±EG_$S“n âÓj1¥2»öñÀûÍÛÈÅ 4€Ö)ÀÈbU@)Ë…KZÃ>€‰ÖÄ(L(ŒtNÆz$œ© =‚ŒÕi€=<zœ×ñ p\ŠTÈ†¡PƒïÊ‰4n+Ç&À¸‰62÷F×=îÀ5€¸Ÿ`¥«fÏ´÷ËÁ¨[z»óNt”ğÎµX¬şO%Q»gôõºI¾º%ØØ‚Ìb¹ÖËVìÍå}­oÙ;¾3³Y\]V©EĞ—{>¦¬6ÛlX˜:4/¾®cbB7  §È >“?”/…)zc€‰ zt60ê@ibp è Ó cb€#tßJ$f$Äa@Ïoì,¸cfŒæÉZ$o¹ÀŠ–:èÎ¹~ˆı!îİG¸{g»™ê·µm´Øæ}KMËR’NMe³Æ»£üú#½j“b—ví›‚¤k†ŞÁ¨ÿ ¢å¥Éá%1iØÍ¶¼‚àk–4%„	˜Î09-~_iGè±$Ïš(C-½ æ‚Ö°°â§‡JMŠnîm`’8@‘­v·5(¿-BIîS,Éscqõ›é]±–‚¡B¡ğ©U²ÛbÈ®˜ïíöït¬šV8k· æëÁW<*“ÔE	ì%•®†3r.Ä«ğUNuªd´gZÇ¸±5¢{p}9ßMÎü dåãZéäAöİ¾Fè·(7$^PæAË*ÙÑÓg¡—%m÷);d”¼›¶‡G‹m¤À¡à¾s¹ŸÃäİ™1ïVÓBğÒ;Ãî©XÛ”·xÜ¡¸ÈçG3ÌM*ãò¸°å€Æ¶o‰Q:KÛ–ó–0’^“àq¡*ÛpÕÜS[R[còõ"•ÎT–OF'xİÌÜ­÷‹v:{(nZ?;Hl¡|9W6\.¯sZÚI`²u³ƒ¶[ãm<™Ar54®gNKSjäkbgo{½›Œ¥Ÿª ÿ ~ßÎÇsËä¾µf«/thEÜ6†‡1Ï9³I	ÉW*Ó.¡hèÎšÊå²Úin×5ZñÃÛ^æÿ –Ã“ZYö¨^ÏZ6»×hG‚ââOJåÈiY!~Ûfİ&f;Sÿ +\WW®~Iê9ÛD1ÊÄqD_0¨Â“È2-¾)&s¤,Ğ“˜áÀk")Ë·²ZªK•­ğLëEdCŸ¥–‚W$ ûè@¹ÚƒŞ¦Ğ1ÇäÀ¯î¬®“@Š’lqéÒø¦k›†-§ÀÁlI”V‹¶öË·:İDC­‡KBã˜¬-‰ÌËLËï¥{mã_êÙ@å]G^Ñ\ŞEÖÆVÁŠÛÕ¾çô:Æ@mtØ¹úz¤_r×]=ÛÈ¦ñc–şßŠÛhr·ßD&òº™%¤3â¥+²úæN[ûWfsw¿L7ÛgÛÛúXï
ô©ïX^úvö¼«hf5×eïVzÖÜàPùÁ'Âºéî¾5ö±Ï5w©“>Ô z>71à/Èà•ÛO!]Jg%°ºî†HC½U
ÃÜœke”ÏÓ)Í³+‰~ÜÑè>5^¢%ÑŠÉ›¶Şñ6Ûq5¤£ûYŸŸÒ+ªE¨ÿ -šûL-‚¶ú’gs³}dúÑÛlgö~ïÜ}6 lw	˜ª#Õ}õÖ½Ã.Í«Ù&s[Ã£ÙGËCÒv?óOëNÒƒtnİ¼µP‰btÃ¬j+UåÕıX×ØÚ2~%–×n§_ù•Ú]Ä[Ô_¦V{’àù„V÷€uv-tcó1-éòsı<Ş¬õ­/óZ›;OÕ¿ñ#r”ËÛ¸ömûÈæÂKí¬7Ãô’†{Û]•óŸL©ÿ Ú¿ìq[ÛhœúM>õ·û‰²÷dîz$ì?¯[¥«İƒ-÷[‹-Ú0œ4^B$÷ÉZÏ%®<vÿ «àÌŞE–õò\ÖÜıi ı›º{K»í¸É¸Z\m²¹¿ñÙË;ÿ §Y^˜?U/O–¿ÄªÛÉı7¥şjà;şëú¥d¿ß¾•¶úİ«®ï·w‹[•ÿ †¡jü|kãøïéÉö¯ó:“äW|r»«"	~®öm’æØ{ŸµÓæ—rÙ®ŸëêÚ6á‰ÿ 5ã­o¦Õ·ÊßÔkÜê—ç­«ó¯ô.íQş’ïçNÓŞûC¦%7,µ™yzs˜Ş¿òÖ=¿=7£ş?Àß¸a¼E—ğş'RÍ™×Q‹9"º·wÉ,25í>a\VÆêá•É[j™Zm–é˜ºd
—ViÉ%±-(æ¡äBTº¤³ÿ JTÀä¬ëb8R¡*¼HÈ]° ´0°ïÆ¡¹®‰àz…¨ÜJœï¤ØÉv›õÎK[wJ>á»¬Z|´ëWm‚ÍWs²Û»Ú2%İ'7ãJÈ×©ùÂºk‰-õ9í‘½Ïm±°n‹+xàoúöœëe¡“×rÎš$”¤ HÀiJp!jé0Œq¤  ”   ” ÒÑTRˆ¤R¤Rš¾‚R‚ğ©c#péHĞøÒÉ3¥lZ\`{Yª3æx#‘ÈšüÂÈıwÅîhf¶ÆN¿6×³6¨ÀÑrZ·¾7-c|¥¯A!CúfY:Ã)9,\GÒÉsîyˆµ¥çÈç¸a¤a—Z¤áÖ„î³Äç›¶´Bâ‡^q³"ª‚¥_§1+w$|–×PDı®F˜ç2G¸99‚ˆ8p¢^£Ñì]1æf‡µ­n·£\88Pi»¡¤ÌÛÆÄ\ñ¥sF‹¶Fâ4ƒˆ$ĞŸb£¹ÛDÿ ¬¸qiÉ¯UaàGãZ,hO¥)dš=:fs£q@Ç´I^
µNHeOív;£Ì‘CéÎe·“ó˜%mÎÚL¬6ÊÕÒNé_¸Æ„4=‰+“9„­ªÔ-	JÉ÷(¾I4iš7Û1¯>«^Ü v ª	Jaé¨OØ6¬Hèå,àÇÇ‰Fd´ß‘‹Ó“>æ×pcôAs+£]7+€âÒIÊº©z5ªF6­‹[~íy·E ¸dâM`ÂæŸV7fx
Y0Rı‹®KWsto›^ñéG% mËAs‚7€3ù”8WûKcÇEr«|ÎƒošM¾ÙæÃrt.{N˜.™ı='%sTŠäËárr¥|œyİ~+ât6›¬ñÛ@/å|NÅ.íôÜÆZ‹€|+Íxóc¶¯’éğ:yãºÑC,Û¦úFº-Ò{Ç¿Óµâ)OÌQ0öÕşï~¥Å.âôİ–†„¶6æ7ChÒĞÒ3H® â ŠoÈÇgùY,·,2OX-ÚÙØÔp •_uW¨Âà‹8ØÇ˜C½`@aBæ¢b3\hYCmÍ"HP»7¼(.8ğ©æÊâ™eÌ·,kı6Ï'¥ƒÆªÙ¡wdğ	šÕàúÍb4bÖÇ7
q©õ$j¤Bâİ§TÎ a¢GÇRÕ4'Ü|JÓ\Ú9ï…r.O;PñPå‚Hk¢´ÔÇBçµ¨€B­ó.d JÍ(ÆÈéuhi:
!2uµTÃb”ÖÎª§0„5G–“ÃV92ŸÛö²ù£‚)‡'œD©~:è91÷.Îí¯p²1şü)©¿Â©c²Õ84­¹wôÿ h»¯°µîZö´1Ä†,Æ¯_"UÙülVŞ¨ÀºúC·—˜âõ-ŠC\$¨ÕÎ½îM{3‘ûf´£*çèıÒ<Ùİ2F°éÈÀÒIÈyI®ª{½º×îg%ı¥t±Šï¥ıÈ„v‘ƒçí¾vÓİ15¬£ŞÛ‘mÅ»íöĞ¿õ|Î-b5jNmvcó°ßk¯¼ç¿‰’¯Z³9ûG¥„Ñúg 5ß\’r[óí,w™€h„Ãß[ÖæOŸ7oÃ!ÄpÔâ>+Z&ˆt,Ø·¸¶‡ú»&ç{höü¦ÖâhZ<ÀuucòrQéf¾Óøô¾õOì;M£ë_×Nß-ıx^º6|‘^îXŸóø×Zóòujß4™Ïoèšù3Ğ6ó/ëvÒ@ÜcÛw€V7ÛŸü„­?İU­q¯²Q“ñúnşİNÿ ¼§}kcïÿ ¥Ûvò¥$—LáĞ\FêéÇäÑ}.ôù9ş‡6O	Ûu[|Ñ=‡ÕŸñGq˜O'hnİ¡|ü_w´Owb#qÅGé&§ôWró,´õgşÕÿ äâ··Vg‡İoäz?o÷Ó½Ì7şÆúù¾íSœ#µße·Üãiå§pƒQÿ õ*¹óŞ˜ïÿ WÉøöÇµï_Ÿæ=m¸úºæ²w×hw”$€»Œ¶xj±¸•¿şÕglxV;Óäçø[È_Mégÿ %ÀÕ¯ÔøéîßMloÓæºÙ÷¸t»¨òb?ñV‡‹m²ºüéı$ÑùUı\¾W_Ì¯wİ;¸[¿¥½Ë¨f,¤Û®ü7¢§öxºe§ÿ É!¯;*ß×ş/ø3•Ü¾¡ïêÒö‘ÁN©a°c0ëú·T?
Ÿß_¼é¯–Şõ²ÿ êp{¯Õ©ìÕı»é.ï;pŸo€{uNêó3aãúª¾lõ1^–ı6aËßßäwpßEµl¯act¢ŞÚMÊİÓù‰m´n ™.AÎ¼õ_RÜV]ã_æv5Æ¼8_ògµı<úİ–o[wÈ·íÅÀ:.ÜÛ½Vípÿ 6Iê\;¡ı':è¯…9mİü^ŸqÍo2íBJ«áıOy·¶·³‚;[HYomÓ14G85­ ]‹CŒ•(% $ †€ ÕH¢‰ÀJ@4†*`)ˆ  Lšbi4˜È§‘–ñ>âåÌ‚İ˜¾Yœ#`Éq¤¤›ÑiÜßäÑ.Ò{âß»÷hŠxÂ¾ŞÖ×L-ÂBµ-›z7[¨ùèy–çşp}ˆ=»${ïrLß‘»vÚö4Ÿø§sşZ‹Z7.˜“RûÈÀ¸ÿ 5_ 'gúIÜ7 ¡c¯&ØÉCcz{ëÙè·µ~ójøíê•¿ñÿ sÎíì¦ÙÎöêÅ‘¬ÌK#–¾İ=Z>ÑUôeèŸ{¥×ŸÓ."™X55ÏaÀ.U•jQ¤´õ$şæ.&‰ş»âkİêÈà
‡.’Ğ€åYúP…êÇwıB\C]<’09²;Ac*€'ÆI‰Y£{¤ÎtÌ†Ü?Sb.µä˜Œsà*«F‚dœfwêÑªî :Ê<áZ:·^J ¯Ó-ŸlY«Ív—ckO'©\VÅ2UÆÏ}·ÈØË¯#’ \ÙXÏ¨2,pÁGÆ¢5‰2àŞ-,]1–ÿ A¡ˆ±ÚÈ©VŸéTvÙô•İºX]ÊCÙÂY%¼¾‹Âe¨dµu«©…ÑBf}ôW²Á"$Œ¸‰¡î¸Õ¥9šmô‚cYû”ÑKqtÇÄß/¨æ+‘ÀcZR;
Îk»[]¿A:˜èdo™å¼eí¡Ö:¬6FlRÎé"q±š4‹z‚:-[t@d}ÎÜ^âø$mÜ j{O‘xáŸJÍZ>™Û_¥	|ºíõ dorŒ1G[âÎæ73µTFğc7‘Fóü€İ<NF½jåuÖN
İM;K«èéìo^ÉB´:HµnY¦u‹Õ£Dì´Lïµƒ½k«i"•VÀHn–â]¡ÜùšÅø•º‰4Yšİ[İ6›ˆ\Ì#½qy1Ó†/hİk‡?¶èôä1ù*w†t–]ÅbÀ`¸.c±˜Ş¥+Â¿´Ö®q·VzkË©r5Ûõ)ÅÑE»@$‰&Œ™!ÀqhÚî‰K‹äc¬]É&;lOxo7rYI
´kv†…%…PãÊ©şTRI†KİîRëÀ’’×5¡Ì=@9ÖpkÄ„Å#Ü\nåV¡{<­*8á5/B !²‰„M&W¸.°í*<s¤­©Q¡e¤¶F´µèˆº“ØGŞiÉ-¢’ì±±Ã92¹Ë$eC‹GQ…l¶2pK4{—‚Üê €9¨¦êÉ”F.$h"G‚ö’ZKöJp6…%Ü­leÖñ8¡ù¸ƒÄ7…iÈPA%ğÑÇËˆĞŠAç…?Wà> •°ê–—„ÒÀucÌu«mD‰&W‘¶ÃPcK\0Cü£L¡´ÊRIZ$-ùB5º°pæNuŸ$hªFZÖ<Ç<–µ +€8©##ÊXF²&¶VÅÔçyZ ÇŠóÇ‰­ZFmz-†'fz] ¸tA•s[-Iwgkz£¡Õ‚Æ×/<NøÕÖÖ®Í…©[n‘‡wØûÃf·du[¼úwÓÏÍO)ùœ—ğpÛôÁ™qô¯j–!%¤óÛ1Äzn›O¦]U÷œ³ªGı³ÚQqôvoõ ¾„‡bÀ\ {k¶¾÷5«9_´ß£F×ÓöÒ9%ÏÖ€béâ•¤{°)]¸ıß´˜ûkûVUÒ~LÆ—gİ\l¦Ÿ™îi8pÅ½*yt¶Ö_yÃoÕŞ¬Ìx…áÔ¨ ù¼+¥eFco&ã!Cœƒ…o\©™<L¨l›rÓ®'<;åM(Şj+^u0xÙeÕ‡õíæ¹¶-MŞW°5áp­é×é´}§=ğÎèé6¯ª?Sö)ı³¼w‹vF|‘ƒ#sù«í®Ş[«Ÿœ3âU½£ğ;?Ê¯¯{?÷;'gsaŞŸñ1ì4~æ½k_¸ŸÙ¾–²ûLËïò£ë¥ë=#Ü6øæáÌN¨$p¬¯™5¢Käm\½gægm?RÈ?¨şİÛ[ûÖó¼\2ÚÎDZŸó¹Îré{Ürh5Çûje¶­üN¯[&:Î~}(úamô×·ãµº¿“|î«–5ÛßpÜ€ÙnfÆBÜ£¹ÕÊjë”ÒŠË|·É­™ßÕŠ€ * T ¨P ” Ô @
€B 7Â˜Ïxı@ì§öÜ;×¸l6+S‹ììGô5ÖóÑ­5IW­ªZ=wù¹Ú“K-ŸÒÎÒŞ;âåšƒoË?¶mš† ú³4½<c–\ØñıVHé§Ëi·ıWóÿ äó÷ë—ù'İÆFïgì¶DÓo´[‹ûİ<ŒÓë õimy9=ß
úS·úÿ ]O·_²¯Ïó?èyÖéÚ0wÎºïÎäß»¾êC©ßÜ¯ä(şXØHhèµæd÷l¯éI~'}}¾¿ªÍşğ,í½·Ú:;kØìmå}Í ıRê&¸/æf¾öÀè§‹†›U£q,	„LL`0!èĞ+‘¶÷ÔéI-Šòn.w˜¼•Ì’¹ó ™:7ì÷RÙG¦ä‹yİ Ã;´È×8yt½„‘$¤¬•¶Õ<[PUvß=ƒ·odîcšõ9¿Ì×?ıõ¯%m`#‰¡â²‰ÓzÏ{ğàSÕ ~`PxVv«°æĞZíûäšÂv9¡¾œº?«(âXä®:h|±­D•m±KôÑØ€ù$t:hÚØÜYàï3H?”ÕÖÜúqã%Hï[<&^û«RÒÇù|åÏ0#Û]<#]ŒÕä|œ´cå2jl÷µšÂ ĞåSáU¾ ›«õ,eöçXèç{¥ò´Å±·æ&ŠÕô@î×SîÛc•–¤G~ø5N'Èö–B…GEmèé;H½n“%éö¨£aÜÚE#Kˆp‘ñ=C×ã‘ãV°Y|HyêÊìî˜áu´±<	­ÙéG+ULy=B8øÔ?¹BıÂP6Nî¼ŠW,¶òÿ P¾V€ÖÀqÅ¬Lÿ ššğ«ñÛñò_À°ıæ[ê²ÆÂíQ½²#Ë”…çS_WMÍYÔˆ÷iµ
6èÿ öÎ”c‹Á§oû9ıF_¸…»½­ìÌ¾}S="–?L¥H%•ü'n…WÉƒ£Û;­—±zÅÁ¶îqW—ÆøÉ?˜úŞeöWOÑèuS2²/şÈ…ÜÖV7¥ä67[ •­¡1ğ¤¬Ö’ÑN³ÑÇ²)Š9=0#dÇCW'p<Å>R±u0ÆçL-¥Qşñc“2T¨Â§º6[j6+6çµîØÁvô(CŞZ%bd<Ñä=•)g¨~F8Yì0M+­7hÛë5èZ—J§{?©FD.íäx¦lì]1¬x`?3KH'ÛDVVšîÖGû¹`š3¤±²ÊàìZ’°‡u¬Ÿ[kR¼urÍo!6÷Í’Ò7$ğJR2Ô×¾ó\¶ğY²ò`ÓÛ{Æ[‹É,n%d2„s=RÓú¨Ó™å^v_-«C¦¹éoƒ7[{4Ò1Íº‘&¦!F)ì®.6[:5¡£dpkß3}?Îù^K¼0ãEw3dòJc¨màFyt0"ÓI­¤„ë—\6wHÇŒX3'Ú«K@RÌÖFèád’)à¼øRn6*¾îwÆÖ"N—Şµì˜R@ë½ËI‰a¸¹> )¥ÎÅ$º•ÅÅã¾w1šO"¥8…ST®Ç|^¼Å^Š©ÌiÂ“´è-7-y†FÆF-`
ªÛQY)›æsĞ;Ø¥k$Ì’ˆc’/NİŞƒ‚¬µÁÀuEh­ ‹m»xÚİªï˜oûrZ½ ‰s°"´Ûáj€ä(Óì&ª­ä%›kBÚµŠÓƒKA~>úzt#^¢ş“ÜßúG99 7ÚWm
;©s·Å"Èøœæ¦:KÅÆ¦ØÖà™VêŞÖ±"Œ"†kõ$$sL7IYN+VNöşªªF\Ì9ªRTPĞS¾í+—\m1JP¤r€Ğ§£«­òSé³_i…•-õ$Ì¯¥ö7!ß¥Ú%·9ƒo®Wt/Òµ¯ŸåWõOÍ¶ñp>`Ïôgw‘Iox×»ÿ îLh v¡]8ıï=\^ª>œ·öüOk2ÇÑNît¬6FD}IHw°!×_Åú•‘Én·F™qô›¼˜óê@£ó:İ†@OM9ƒ]´÷¯©Où¶ğ².…	~˜îÌ:n ¸kø?Ğpó\ëoòØÍ}æ/ÆºŞ¬‡ÿ ãi¨˜¿->—¦~ãUşF½Ñ›Á~ÇĞßá÷ÓÛM³ê.é¿]ÛH.lv£Üùµy]s3[)j€K|	¯_Àò–Uhi½?×àpù˜­J©î}·^‘æ
€ * T ¨P @
€ ( P\CAsŠ5¡\ã€ U!nxWÔ?òÏé7cÜK³íWsw§u°è/n7õ…¯PYÛı&Àù‹‡òÕºñúœ¯õ¹½p¹×O†ïîş°|÷İŸ^¿È¨>¤V×vŸL»nS§ôÛz^ïnr}Ã‚FäüÑ†^W‘î¸1iOÌÿ ×ÙüO[wª¯ŞÚ¿»cÌàì®×‚òMßtıGqï®!Òî›äÎ¾ïUTy-QÔğ3{¦|GÅ|?©êSÁÄœÚlş?Ğİ~äŒlQØ˜Ôk4°@åZlõÔîMUBĞ¦ıËæÇîNtÉv+?räpå8"Õ@¹İ¹7®Ã¯J \Š¯İ`¥HãáVªO2«÷#æEÈrZk¡è¬šçú66—–‡¹îasÉ'3ˆ+ì­}4·hêäŞÈÑ´Ù»„ÊdİÒ#\¬²4‚8´ï…C½6C\–æ4–}È^eº/Õ„°G\\Ç4ze
uĞ>›™MçQ‚â(ÚLwÖÃÕ-lm+¥\UˆzUÃêÙFå¨·×Û8E&á#ƒu2é²¸;ù~EAÈVoë€ıHëø”®÷{#g˜¾kÆ8;ÇÉÁt-ûëlxl×ÀÎÙ+%½×m’áÎŠ˜İ©ƒB®(8cZ×–ìÉŞ²R~âè^ÆÆ
ê„ ,iBÕh<ÇóVê¤6TtóJ]$¢8AF—5'"38UAï½²ˆFé$SŞ€>R2ËM6SiàîSÅnæFÒŒ•:¹êFñ¬&ú—\°G&ÿ ·=îì–ş£Úó8£²(JoºY‰å¯ö¢#¹öü’ÿ j`‡©!*?)@¾šÅ—û‡êQôÒl7‡Ôe«#t®ş£Is¤Ò2€3åZV¹R-z2H;r×xóÚFÈ"ˆé,`Ò®È)R¾5•òßæ¸ğÓ!Fç·ÎÛrØn®ÄüsšCBa¨–û¹×N)_jÉ_‹ú ¯¹†Fúws–¨kN—=ÁšévÇe­ËéäOLŒ·ıÃvŒ¦Ş..nĞ$sÄ’F§óf9bµ“Åî’GBË‘lå›[ou÷L˜åØâ¼t`¸ˆHs)jb<k‹'‰¹Vƒ®™òFµ6 Ü{Æï-šÛokŠ4BßO\œ4—.G…pÙb_©³ª%¿JD0íİÍ{u,« ¹â9]m2jq8 ‰Z-|j³T¥ÛüÅã³7=±¢şÆîCfÉ@ğ…ósZ£æÇÂJ¶–Z”ğµªdö6‘]1Ï2\Ü²2DáúZè\©£0=˜ÖV»¯diX}ÙNïi²’=ÑLèãkœ¨5ÃI
ääã’ÖÔËnàê™ }«Dw¸Å#L³•¿µ®hçÂ«=™”ñÑ—¶Îâ²ÛÇ¤$i€y™¤sd `^$H<«?lŸ>æ¸üš×©³aİĞÜ>8!»dëY™8€ö vÁ.-]/s®][„õìuopl¦=°¾qkÇ§ pG8õZáË‰§)ËWğ:++Ë	¤„±ÍcAWÈ¨ÓÇP+7Vº5Ø¸çÚi1–‚šW¨Î²vDêˆŸŞN›F8†¶j#—Ê\ì0ÂË§?Ótˆà®le­ÅhÔ4–¥¸‡—½ÊÒZ:H÷T2'ZÎßë?Ô45¸ej’“2óŒ—2±¼}&4:¥i[¡36íŞgjŠÖæh‡æ”€+Ids¯V‚v+Ù²C$|Ğ(äÒhä¢%gnî*ZÉYY£Î´^…Z±/2ma²:Eş}Ò­]Z’cJ×Ğâó4®üÌkxÖîv2y‹§¶6·±Ş­ÌÄşo6İZÊîeëß±VM£¶XæG$lº(h‘Ï%}†§Õ®ÒR¶Gğ4m¶È4¹Ö–‘BÓËV d¨Õ««odek÷eÆYÉòË£B ĞÀ^Z>ê5Hm»k4zúœ>Pt±ÿ ‡|g¨¹:ÚÙÎş¬Ò5ÃÊ¬:Ú½5»ZèBı²İäëò´’â½µˆ®L®Û+Hi`!@84¯
k5»É“ÅÈõ#µ‰Ø¡y“I>ğ„{)ú3ªª!Ú4Í·½ÌR#(Tµ÷{2JÇ'‡\…Vívb3„jSÕÇ
ÃÄÕ3[µîlû[zƒtE¾0Ü ô^‹¤4~R’½okóiY¿Êô·Ë¿Ùü$áó|o_ªßuóÿ sŞ!š+ˆ™<C cÚTœˆ5ú±ğ-FŒ} * T ¨P @
€ W¾¾²Ûm%¿Ünb³±¥óİ\=±EFeÏy ¤ÓUmÂ«nó¯{ÿ ˜]›a<û/Òİº¨üjÇİY¸[ì<q–úA¥Èª‘/ó
Öõ¦*òÉd¿×úîşE0Ëßeıv_ëCçöîÿ ©?Tñõ?ºäeáÚ²çXí¸ù'˜“,øÌOJğ³ûİk¦ı¿ë_à¾µãû}··å_ş×ıKm[©²Øí Û¬Ûù-Ú]Õîùœ|M|îlÙsınëbÅŠ¨ Ÿt8êr'öW?¦Êw(K»fåC‚¡ÈòªTfnå	w†NBÖË™¼†|Ûô@!z!ÌU§¢ÌDgÍÜœ/"xµò”dîXÚJ=	áZ/™¼ĞgËÜíP„áñá[¯ÍùÍŸ»!Í8Åk¢¾%»[È]Ï¢®·M¦éú6‘én¬Pÿ Ic§-N ®äWê¦ÛBïWôîB7MÓn`v¿¾”kôíôˆËP¹|RµXé¥"yZ¿Sa“rÚî#2ßº[§µö¤s\£ ÜU¢´Xìš	º³#t¼ÙÜZû{OÓ0…pÄ¹Ç‚4æ|k£n·rsäuèŠŠÍ®lÍšF—{tÔCI$9‘[Ë1„h:ÊÆèÇré@¸x-W¹Å­^MjâMb¬ë(×‚aÛ6İˆÍÚåàH5jŠ9èÜ0Òq tçK&\‹èH¼Xñ¿¨Ğoil·dV×rS€1:œòOá\WórÑM«_¼ë^.7³d½‡s*Ëhé.rQåhUã ’påZâ÷:/­A9=½µù_ŞfOÙ[Í» …×LcJ6"®^ ã…t×ÏÃn°r¿5zOÈÈšËs,'Ëˆõ˜pÅ2U®ŠäÇm™…±d]"¸ln4°Zšà§‘#Û‚]Lÿ 3èKP÷zêO!!Ú[8¥SPµ!jô4ìûkx{¿PæF#pÁÍ:‘alôØºa»rw»5¦çÛo³|öÒ™[¨Å+ Õşæ#R{«Îò½¾G£†µ9ıÆæÂòXÛq¨^JKu,…Á2:ZìkqFw²n^á»8·s­½9ÈZû›-<µÏ*—{¶º}ˆh—µ• ¶ÜY¦áĞ[\DâôŒÑÈÑŸ1Ã µo-v—#­^ğ‹Œ|&à41ÖïxÒÖÏ­Ê*I(ZÉŞjZ:m–GÙ%ÌÖ±2"“B#q{‹İ€Bâ€W›šõz&vbMjj¶/¯ckA\ç§¨dÀ¹ÊÓó/*Ée[3Dº¢ô{ıÀ²Ü?­l÷ÿ ByõZŒ$·ÌqÕşª‹V¯U¸Õãr¼»L›ã7¡ÑÛ]úm>‰ù¦ d9§úA"±õUjêÖŸÀo³å]ÌoÖŞÙ¹7¦ÜmöÒ<ë}»5¼È~Rç+ÀQ[ñVÖßğ0Vµ~­
›ÎÂw6Cua'ê\ö™5†•]^Q¬«|9Ö9ä,˜ùêN}–àÌæB'µ2©—,V?HÀ’ñÂ½*ù¬?‘Àğ¶ôĞÎşŞè¦Ü[wØæÆé®Fª7«Î»}D×åƒÿ 4=¦ámlÇpnåˆ Ç6i!rüÀª™ŠórZ­Â¯¿º•´o'gµí¶·¡÷UË™3?Şš›.·WÄçeÏMxyªÖèôqY¯¥›—¸vÓêO!º`plÆ2}f´â Ø+ŠØÓ[++êt;>ë±Ü¼6îd¸\Œtšq\•B>úòó/K[&‘²|ô«Ôêı+’ŞÇ×iÌºGˆWTóN©¥£2uºz²hà`pÊ8‡”€	ñ*…¬ë}v'XÜ´	'Ñ"ÿ •½ Ñ÷Õ¼¶zÇ¨æÇ¤89 HÜ˜ÔGzTKÉ‰Äz’£P#RÉ+mz“ò*Çf÷Kõã§[šZ}˜TÕv)Û£$;psµMÄ!.%Î÷¦ª¢„òci#[‚U­ŸmU›HIŒƒLnÓ<«!É®Ğtãà•
òõ"Ã„R¯Œ‰Ãÿ Â+©VœèM{—Ñş˜Á²,êi>„Y®ã'd >g5(™Rû©ZSÕş#«O§àVô£–TˆÄæ±I×ê9åÔâeÁ=‹–^Óª0ÒcaPØØ€ş¢q­Õf¿ĞÊaÇpÆ¸ë)8ë°  ¡Y|Gj¶)î,œà¿¬Ò¨u<´{Š§jö­»‘ş¢È»ş6‡1tn)ïT¦­^ÆİIÙ¸»LÒ‚@ÀPá
•×LªufVÆãDV’ïÔ.æ I_öå{Ç@pÏ•§ÔÖµk¡^W=YS0¡ S^uÜ$P¹»|-%ÌlQ7 Ö0‚zD×7&Ü$‹}»õ'wí£¢&Û‰%Ö—'È«ùKqg¸øWÚûG½<X³§jtkê¯õ_Ü=²¹Ÿ:>7üÏãñ=CdúÉÙ{³Cn®¿¶\`ÛŸöõA‡½+ï¼wÉS‚êÿ ­ÿ ‹ÿ sãócÉ…ÆJºüw_yÜÚ_Øß³Õ±¹Šæ<õÂöÈõi5WÇjidÑšiìX¬Æ* T ¨P^öFÇI#ƒ#h.sœP 3$šiH_İ¿äWÑîÎ™Ö7İÍã¼…Ó³ì­~ëzçËéZ	4ŸøËk·ƒšú¥âUëÁMÚªø¸ÿ sÅûÇü²ï[Ö¾Çí›nÚ³xşíİ²‡^»Qí–s=YGQK-pxÿ şKKì¿×ô5ÃG—ÿ ÇWoÓ_¿sçíîMÃ¼îEÿ ÔáÜ;Æáõk~ñk³Äüq‹n·"1oÔkÅò}ŞÑÇx¯Çı|äõñøZìzv®‹í{³.nãdP²Ş-ÚÄ Šš#‰€ph WÎßG6rÏJ®”QU5ÏsÄ‡Î®I¡xì—ÖÁ†¢\j¼s'äwßs{@Ì—½|Vco%×}ïnÒG¬¤f˜×M|9ès¿-w2.;Ô<Ï=m_–ŒÙ»¢öO–20ÅJa[×ÅHÉùO±NMïq˜àæ´œPb~¯íèŒ^{0¼İeë9¿éa|JQÿ ª»À§%»’3bİ§BøÈ_ıÉ ø¨~N*õ)`ÈË0vô…XÎhï½+yÔFµğìÏªî¶l.şœ£TŒa ±Ùb3ê|İ3Ãî}kÇ&t-¹ôw8å¹±ˆë™°“#ÏÊ[_]ª³6ª0zib+˜íã—–á:5‚ö±N$@IÀQ[¶á±8Z¢£¯\ï<ğE¤“$ qÀ•ıÕªQ³2vÑI±KŸé½Zà
´—)9†¢šÙ´Ñ]‹v‚0è®ÄÂ ¦5¡y”(:fk½UÒÜ¹OÜ¤Š+k‡1]ê1Ò44¹ÿ — ‹XŞü´kZsz3cûVàØKç"I:îä‡zW€W¼Š·¦ß#º¸­î,{¢Æ!ye¿Lùš1ÒêÍçÁgÆØÊX³-UÉmwÌÌ]s¸Eupôş¨‰Ñ;Ê|Î MEé?-cí.¹.´nMÇÜ^]µâ)šĞ‰¡® eÄª×2µjú£«•­¹Jm²ÚF¼MleEnv.toDate(this._instance.range.start) :
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
            var subjectInstance = subjectInstances[sĞIÔarÿ ÃÈ×U<–ŒÊø´Õ·[;àsãŒ í»N¢†*zTòêÔ³Î¿úrY_‡=.^ö†…` a†®5ìâÍ…¥¢ûO#.©ï÷
âúú=ûFˆÎ¶H[¯2¡çU\Xï30yrSiEšïn¸c¬îma’æS«ÖsPÈyÄ'
çòğº.Uz>NršÔĞ¹Ù®6ç6vˆ­`#S ÌÃæpÔEy\ùèwªqÔĞ³±¸¸´{n"k‰\<KPº×&[ªÚ6ùêÚ”K,QÚÚˆåt2E",…±Ìe€srmè_U¨l.lì['è€s÷+“æÄœ†U9ìÿ 0éj×bÕ•á¸®°‰¯›K€“Õ”o#\	Á3¨µ8¯Ì]o/BGnsL$´¼Û\ùZĞè.ŒeÃÌ¢æ´,q[ìmèĞÛ[‹‰Ïî/’ŞÒ;.ğĞĞÖe:ÒôI~]XVÎuØ»+t£~É¨àÉK‰Ô2V©dk™>Th×%¹“.ÙäšÎäÛÎæ‰LØ1²I§FDh	­Öz½•ü½6¦¦(Ü÷!¸>=ÎîXlg&8ä‘¤2iÌ´†´˜×r­8M¿Š9yÛ—æzdÚwe·»¸v—è’âPÍ'\¾a‚ÓYZ¶©ÒVŒÁ¹Ù·KK=ºÂé¥éåyƒ€	Èëº™ém§5±^º¢İ™§EıÛã¾‰¥¶ó[ê1<€ºò¸'®)½Ÿ'½K–ûßrÅm#­·¹à+ãÕŠêÖ\8bk+ø¸mºâş×ÈÉ]&PÛNõ±tfâş×ô·yÉt×éRJcTå…reö÷²Õv6¯—^ºöÙİFãa¹:ïl“­†F»Px¯2şÙãä´C¥—g†ÇBò®µHëv_®V’‘õ­Î×ŒBÀ…
éÄ×—›Ø|Š¦éem~Oú4ó±Yşe¥m=ß³nñ±öWÍ‘²ü/¾\xò¯üñ7\‰ÕüWó;­”Ö²Ír$Ôº$PÃª¥%«Ü–¡6qx9D•è˜{ëG]LäwéXÖe×–—¿O5@vvá²MÜp/ykzùA$Óã¨‚æÏËƒY$G)#àòhÕ†	nüºB2B¸µAğ¦ò@¸lÅo¨ßRERØ‰n¯øT³%ñ¤Šù½–Ú^åRœpà®r
kÊ×DÄoêå´œK°Õ§Ú†’ÎçDrG]I K™µ8kK@ğ˜VŞ£{±pKaixó-hA¬4,V­·‰D.‘ø5Øñj5S¨m:¶Ép‰ÄNhÄ5ºpB´Öš™ÉåŒ†½
pn¥ö¥#H17 CK‰üş‰ !È’[]xë×ùgş¤tÁü^57% ñ5WREY‘uq,)yL
5Ï8òyÙ3¦º™’Û>ùº%2%÷µ©Õ0ğZÉ-Kzı§xèÈ³ºkÃ³iz;Ÿ •Ù]-©æ}ÇÛ}Å®–xd¸`R×£ÜĞ9#yp¯oÆò1­Œòóâ¿Íû×wlÓöÊæÆRC´49Ãş"Æ¾£Ç÷"Šİ—Çó/Äğsx8­«¬?†‡[¶‘?VvÆÍz7š0¹\¡ 5ëc÷zÛKã«	¯ğ<Ûxm}7kç©ÖYÿ ˜ÍjâÍ×lc€êCšğ=Ÿuv/+Ä{ÒËääÆØs-_Ş(ÿ ÌÙ$m¬b(§Ô·»Àx6C]·‚úäû‘“¯‘Ú¿ûî¿ÌMŞ@DWM£SıÆÙ]Îïsî*ùûzëw÷B«_#ûiÿ “ş‡½”İÕ|Ù{ÒîÚ7ém[vßhS¤·áãÙO÷×³ø¶k\^C{ã¯Ùk4yqıVÛ;€û‚òÿ ¸H ´oûÅÍÜ)ÿ øĞº1äYYÛİî´Å´_#\~-¿ı™lÿ ë_‚ŸÄæ]õA±FvıÖÛ}»”-¦(í1i'©5ædÉäù››¢”ñ¼uÊµ_ÿ 3ûÙÍo]á>Û)nàÙa™şbÇìV¹ò{^\N/WWñ4ÇîX²ÖqİY|nã¿Üïö#’Gf¤i²^ê[ó›ñÜeÁ±†üÏZÕxµ2·“fg?{İîpkÕp!.«ô¨·3õ¯m€Ûmöì”eÃ±RHĞ=æ¥äÅ^¨¥L¶èÉcíÖcçcAã­úÂ³~f:x¹vÉÜ^B¹­Öáÿ š°·¸Ñt6¯ƒn¬Ô·ìdBùöœÀ?ƒr_İ#¡ÑO3ZÓéÖ³¥–q½í${Ü˜×OvìºûzşÓzÓéåó|­µôÇJuÒÚó²{µY:ëà¾ĞmÁôİªi¬s^$Wıß]•àwf¤ƒc ˜¸7š„Aå…r[İ/mëáÕ¢í{$kcJ^r{çÃ…co:ík(ÑxÕLİ²»ŠäKs4ÌšXÇª&”(Ñ æK¹WÔ^h‘ÍK§©­úWÜÙÿ DşòéXíœÖ±Ã0ç1ÿ š±Y]İ‘—7i]G¡ªUªæºƒË“7¸.·^R9ŸÌÉö¹Y4†îfO#´á
Ë5µré¡ºŸc³ŠPëYÜ&:š p_¾šòm³CxFfOkqh\í»ˆ…1’\÷8ó®ŠdV]™ƒ£_¡˜¾P\ÏÑË‰Œ’J1ÎºÓ¹”ı…¸·}Â?1-!¾VˆjÍÆ¸ï‚‡U3]#JÅä9ÆíÂW€ºI¼s<jv:VO‰¥ŒàØ,Ë‘®[#z²üv—[Lr=J•ƒªOTtU¾–öhHÂÒÏ#Ÿ‹z¨Î’ÆÃyZÜûÍƒR3t5¼€Í"•²ÃxØÎÙéÜsr1ÒÁçd…UÄğZmÙhÊ¬5 Y·Û9„ÜÛÇ+Ü	:À:H+:ÍæÈ¡ú4{¤Ê×[U“œ_m¹hMcÊZ$®Œ>NY†äÆş>=Òƒ6ØFb1‹—Ï–º2ã &Az³ áÒ7.±›‹˜ÇÅ'¤Ö—J7—4ûÊ„¬,èŞ¡ZÚ4(ŞnwŒĞÊé$-j–H[æäĞœ)×&Q¯hÔ§ÜU²µc­±šh?—_ÒÊ›Ug© fº·tR¶k–D|‘‚AhWIJåã[i¡´µÕ›{<ñÜFëW—ëè•ïs½22l|Wjº¹:q¹Ğ©¸Ù\Äö>Ú6K+=ÈÒà®½#2NDÖØ²'¸^‘ª ‚şæÈ×	!»‚tJà+‚{«Kã«×H2æÑ¤ÍÁÚL¡·1kf§5­ò†$¸ ér<#n2µÍÜB1%Ãdl„rLl?(ĞE9-idfìŠ¢8ìŞ/ln4!Ğú`–
æåNK]2ßå²Ô)j™}½É¶¾6?s|İ]+C@!¸àÔÒp5‡íï?—T‹Y«îÇ\öµìl!d‚à87Ì$¬E/sœO
Ömz½ŒíãÛï0§¶»dŒ;P4Í!­ÔÌ4êÖ»«š±¹ÏlO±]× Z¸İÚÇ,g¥Í^.ÓÃ7¾Œ‡¢Õ™vŸJM¦õíƒ\¬qÔÆ(Ä!)Ó
VO©nŸK4£î~ÛÜ¿§Ü;j¹ n6jÂHàXìk•øÙiÿ ã·ÿ VjóRßZûQØí÷OîÔøâŒ¦æ)œ%ä€ª4ùeiÖê~h6é½Y¹¶wçsm;„6ö{»&·*H˜§¡(ª+ÍËíx/GeWGÿ é±×O.éÄÊø—³ı\†[wÒYíOVâÜéÒ™1^ooÍÿ tÿ õĞí®j[S·°îNŞŞ!õ­7f±Ís­¤FHud 9“\y0µ»ãÿ m>îæ‰§ñùÇXw©ı"K‹°ö ¬iNÀlÖñ«›ŠcGŞµ„60Ş]ÌOéãn‘«íÎ®Öl\Rt®qÕù£„9ñvuŸÀ¸@y`u‚¨²Ğ¶‡	ŒŠX¥-$–@Bá´ãî©m PTx¿/úg&ÜÒK¸”U«0Ğ‘Ğnqù.$xqüúÑxğªåe»u{m…î.sn/îC•]jà—j“ÃlækŒ‡‹Ê¸/µ+JT›X²ÇœÀnœ9­ø4-tUüL¬¾¦NÆ'õ”d¨\Iö×]r¥ÔÅÕ¾ƒÙ8¹½ßò†ZÈ­Ü0´‚D0ä¬Şá#†ßC² Ï¾šªby#~×§ ÆõÌ¾ğ3­½%Ûñ'Ôo¯à!·iiº‰ƒ‹ZïªX~(%öf}ÖÇ³LÍ–Ğİ-0‚qêq£éÙ¿°¾û£™Ü{#²äkœ6ÇÂH*Xı /Æ´ııñõ1~Û[œ^çôû·ô-Œ{‚€ÉX÷­/ó×®ê~D[Ùjúœµ×Ó½Åàmm%ˆ’u6M%<WF?ÿ ĞQï(æ·±Ûº9kÎÂßœØ×Fâ„Æ”‹]Õ÷ÌÜbı¢ë¡ÎŞ}?İ^C´8¯ãùqÍq×_xÄÿ Z3~Ù~ÆtŸJ®¦W~™ÌÁ’,W’´V«İ±ÿ r2~ŞûÒ[ÕÖÍ½î{q`,Q×Ei_y¢z]ı¹ÛGRµ÷Ó;©]¹6íæ0Œ{Ü@åŠå]9=ş÷ú¯?3,~Í“Æ¼g²‚;_¤‘\Iß3Ú?÷â	éˆ¯3/¾*ïtvSÚçôšvßJíà ¾Æ8¸5üMpßßj×Õ'U}²:A±Ó»-Ó+Á€…ÃØ•Ãz{AÕ_o/Gôój¥³\†±Ø9¯sI¡®K{ÆWµMW€º³RÂÚcl~ŠHĞxCÄb+…û¶Vÿ 1Ñ_
‰pöÕ…°kÿ IHe`+ï^Ço:÷Ó“7^=WBÄ;y{DvH¸zq–k€•³u³üKX»#N¦ò€¸üÂ1æ$óÎ¹m¶Ùš¬-»e¹™èèt¸âíJªæ¨YÕKô[¯jİo¸:FGP´_Í¯@^;êYÿ ·ô·K‹ ˜œ¸óÎ²ı×ú“E„µiÚáAuÒ“óÍ Éq¨¿˜RÅŸØŞ"“Ñôâ™ƒFÇ+ÈTp¯×j=O’T²,˜î¡g¢æÏnÇê¹í×S‚aí¬\7:«46ßp‚8çŒz³¼F™ û…+âm§¢)eD’ŞØÙ´K35É#C^1 rÇ…%Íè_©TQaÚœÖ¥|Îÿ qÁXßJãWùº™şXĞ8(œ‚âøÈÔÿ O
ª·„&7ÑÓè0y›¡îj°èä©ÇŠT«¾âu]Š.¶´eÈ™¤SÊÀ4µNNqÅkevÑ<j˜“çqDÙƒq{€óÑQÈ¾2LÍ©Ó1²ÃtëXK¼Àù‹¸ \éúŠ»®Fª½œŞÚAn[#bM ’]—«Ôv{*é")/.ïÀ#º¥h¤ó':µZÔÉÚÖFuÌo¸¸Ç#F:‰ ‚#É®¬vURäæµeŒ’ÊôHL±¾&œ@iòzŒ«U’Èu±Z)n¢›Psİ:$æ1ÅyV–­ZèJµ‹2ÜO¡ÑÜz…§Îìïh§Bíw•#{c˜Ë‰kT´†¦§WSR äd¹ët‰cZ×#¼ƒá–
æ¾
³Zä±£kyê¯ªÖ9çG//
ç¶(ØŞ·ËQíóHa’8õ0¦.ñ÷T;Få¤OxÑ,0ÚÂÔ’”Nò—‹\ØëÅ¶úš[Uí`Ís¦¸Œ\=#‘®'Qi^UWÕŠˆ®[<,µVÍq”°¿P ÿ 0ç\V\u{:"µÅíµ¬±ÆøuZ\|…mMQK}·Ïu^œ°J\­süÃ—%ªˆL—e%y¬oEÉÎë–<ùÚè¼áã‹˜Lªi–±ª‚]-=ÅÎÜmä.s¢Ò±¸à^q5´qÕu%>Z2½şÛ¤>»CÚ<’=-rŒ@ gí­)“MíŒ¢Ó}bív×Í®h ‚Kœ?*Ehø[Fµ3üÕÙèh;»"ºöw0±Ï¸oV)ji0¬«ã:ê=yPÌÆÄÛÀÓn©õ4²=Z¨3%OÚ]7Ôˆå±Tí6I_rÆ±€®¸İ¬Háˆ oëÕ¥>“ê5Ö²ú…ÒÇ…Ÿ$/hĞÓ™Ëæ£’<êŒù†Õr×cu£š5‰ƒC×“ƒrÅ¼«UÎ¿Z«]‹—s†Ù”‹¸‹©#Zà­+¨íØÑrK¹Gõ°I' ùìÜ[.l¡ç‘L–ºmkÊaö-Ú~ I;Ÿ,˜ía¯jcä ƒYd¥l¢VÖ§I²ıPîİ†f>—ÍdÇöOçs”" TWŸjÇmSu¾ã¢¾]¿V«ñ;ı¯ë•›Ùÿ ûÛ?IåÈe„#KS€ÈWŸÚ2U·_Ì¾æz4òñÆ²ÂÇ½»sÏs‰åàAÎÒàOåsN&¼,&J¯Ì~z†7[}-3h1‘3SætQŒF3PpU®EFœËvÛ®ÒÆnY$ `CÁà¸g]uÆû3£ÜvÇJ$lº¥EqÔï
µŠÓ±›zn‘ï¶'[›K´êéY5ÅìRRV–úW’Ù2BJ¡äEF“«4Uì1Û™Ğu—H2	 u©µª¶`±Ø]ÚÒ2Ö¹™ÄâÆ„'ª“R²¢½1£µc£ÛŠ;XÄË[,Étíßrgï°†zÌ´@ ¡<5²ò#dJñ_[Cİ7÷1ÁnÈ"É²9º°'ßZ~êİøtZ¹dW;¶êwFx<1£>€W=¼‹÷4®}Šp]Ş\4±÷×sOÍ¯H÷
ªe³[²Ş:­’/BÙ5ƒ$n˜Œˆ#>®*•ÕÚêE—mØ­.¸K‰ÈÉ†Ò»Ö»¯ÄÁü3bpcŞÙ0BÁ«.c«ĞJF6Îq»™Ó(ù¤`_T½:½Ç/¢#6v/j“	ˆdU}ü++a¤tµ‘“c¸õÚaks$7Q=q5Á—Vªëi3Œs=êØc #½00è‚¸/İªhsìîã–w“‰ªW%«u²-A­Ãƒfù\3À¿G+®ã…Ô«w´Ì&ÂŞ±ä¡ q¨Yòo!Â½Šöİ¾÷˜›¬p.*áà‡
¯Üå¨*º]vãdq’‘ó;ÓDàÔJÆŞFEÔ^šeh»sd—Q™ò°ÿ ³”ÔœéWÈq«ûŠxçv¶Ë#‚[J	$¹tûNU¢ò-Ñ¿¸ŸJ½†İÙ­Ü6ÿ YÃÌçzŒbüi<×îÆ±W°èm6ˆ^ËvFö%ä–õ\î÷o}:®…ÏJ+–BÈ!á­t‡ÚN¹Kì`“Ód-–}mLZÖcğ¬o¾åA]ò>0^İd7å 9:`¸Ô¦	]Şæğt1§"ò
òÁ+dÕWr`ĞMnßJ=MÄ9ïø Æ³Z½FÙCäÔéæo”êhŒ9Gİ[ƒ%l—œÖ’q2y%f™'ŸÚn¶¢BÉ¤|.o0AOµû5é¡òºM»}Â+˜t[Lùa8IÊ!\—£[›¦Äì;mÎ£úSkpqèÄé£Ö²ë$¼i˜³vMåĞ“Ğ{c!ÚØùWIğ"ºkåV»™<•çí-ÎÂI$qJàÑıH@ò¥W¯[2–7SÎ†&”F$`??¶·ã&\‰m¿Pm£œİµşm§4<¨µR{›‚`,õ¥Är†´ ×Nxd+7Él\Ô·Ûo4mwª©éKˆÈáÇ¥sÛ#Oce]uiqku¡ñë¶‡L@bHáJ¹+jüJuiü	mìöû˜C¦·-ÖO¤P³/Ì™•òZ¶‰5¥SCZ×[I4PâÆ°–©ÒS­i*êY/òÊ(DÛ‹—Ç(¶dH}«]IÖ½N}mĞ»ı;C¤†Ax¼+Àá—İ\örôgEtÜ)ÄÒú$XÚ„xr¤›H·T=ÖÒÊD.„>0ArAäb€æjëxÖIµgB	vÆ£Œ±‡kEk|­h^\o\¬ÆØ’ÜÛ5»e{-Î—·C¼ ªyû+u•Æ¦~’èDÛ)I˜F W5ÈòxûêÔÒ/Ãµm÷úÅÅ©‚É'¶¹^Ké&9öŒhÇk-teB£œ•é¤FÖ>iA{As3ur%j[„4›PÛwhda’Hã¥£`Ã>|ë–îMR†EºZ¶IšZRÿ m­ øêñãK¡2š3Ê<>'0ÊæâÓ«‡"FU£2hÊúW´A#L3±ÄÆUJgˆJ.…VÏbÌ°K>³rÌ¹e 5Ò8œ¿
…mc¡n°¤­ë!yváoéú‡Ô:1hÑ5»Mı,Í8İş”:ØÜIãhv½%PäJd*}_Í	“éé&Ûm¥ÿ «0¹ÀÃı7â]`ì¯ê¢59ıú”c´¾²ó0+¤qlP …MXåZ¼´¹š¥ªOeº[Âÿ ÓÜ9.Z\$£ÊîxR¾6Ô­Š­ÒÑî_É&—@Z_å.cp<TÖ0àÑ4ÌûØ¡{ÛªÉ¤–·@sÚ¹œ«|vk©•ê™šÇî-k‡09]'Èåè2®–¨÷F1d9“µƒĞ¹ÒÄ  5Tb5SP/‰vq~§ÓÉ;ˆtnÔ¨_¨âX•TŠk{ˆPFÃ$^¦©Ü¯æJµuÔ—F‰}idd’º-.ÑHV7¶¤©eyœæh@c|K#µËÁzxSuVPõ_šØê;ê/tl°Ùxë»i^±ÊİD°”Í1¯;'µa³n«‹ü>ã²¾nD¿7æ="/ªı½¼ãÜ6¨6ë¡Í¶ú0¼;ûo“TÛ‹|·;qù8›ëö^Õsc¸Bû­¾î'0”2uËß^6EdÚz>Ç©N/bó –2^ùéŒğLy-q´äÛB8ä–W¹Ì‘Óù”Šçm² ¶ĞıMy{ZSæ!\(%–6°k»
>fFÔ^œê´|6ş6·Ó·Ò&EÍ\ù­h¯¦ˆ8•}MÒæEôf6¢ÕÖÍ²â©²9ŞÄu´ÅüphÃöÕ9h–Ğb‡_oé8äKË²¬„Ù;ŒÄ {#Œ
ãï)]	¸$dnd‘?MÎ·+$ô­i" 2C p™Ï{W ‹]T´	©%·Ü¡Ôã$#1ç §ì®ºİ"q›„WÕúMe¥ÎÇÆ´õg¡›£]I]}o›h´œK@õÆ©İvDğ}ÉY¹[?ÊÆEÆ-kC^R«ÔQ±/îS¸İîãv–	%á¨· +ÖhÙbF<›•Ì×"6ÆĞ\J—‡Åli£uT‰%ñ¬õ{ÎNnUË|_“Dí¹1¹ÓF2 ¸“ñ®Kâì\¢ŒğŞ:@Ø†˜×¼ZäxÜ–¬‰â·¹{Æ‰ccSÌ­S‡7ÏÒ´ô	DRmóHõi8F'@*záXÛ‡È{vÏ¦6Ì÷.Is\«4œèÊ’h¶[V)×‰üÒ¼®NYØ×ív!^Ç!É¹{j-Xê	°Eil­1ŒrPœuà’éåL^ƒUyíy}ÆNÒÒÉ¡õLjª“Z š^İÚ½„Îæ´};¥ı¤ ´°±öé!ÍÍp©ÇF Ñ¥’0ré-Pj­UšÔA€G2ºSçDT -f¨¬Üçö§qZ¼ÂÏÓŞÊŠ\×ïØ•ûFuZ¸>›Ô£q·ÌEÔN·–0²>'jEÇ\r­±Ø´&„òG¦×tŠE+¢à#ª}5Ö£äú1öÛĞ¶zåÒˆ¿Ü–7yIã§¥ì$n÷~ßr‘»@j¹ÎÁ¸à”~ÚÈ~µYêv[™Ûmufió´+BøUpÈ” åVU›iØf–Yb2(Æ¦†%ŞSY.”28&AÁq½kÉ+dÄIæ qTò§£¦Ó”SÛrŠQq%‹ÚqkÌHäPb+Ez5ƒó'0:ÏzšÑî“Öõå~@@oSÆ°ÉâÖË±­3:½M»„Ë1}Ûp 4 rËo¥ùN…ä.¦œ[Çê"´Âö†½¥¾n¡M`ğä]=J2Ì{5”3A2Y‚qÁëÎ³õÑ­JâºÉcs/„hh~n<ÂTÁ\ŠÎ‚‡5²D„âÂÌyû)«4´Œ£ybÆ²Êg´—H÷(	­ñåoêDZ½ˆÅË˜œ—¸)@¤ôÆ·YRÑ¸Ûİ²G´ÇBëæs ×^,•{3U• sí%®AÏMU™ŸÕn•i"6„1¸q<|+,’¾IbG3Fn\¥= ˜/[Hæ¿A:ËŠ™	Àº°».º3Y—Ö°¸	Ç 5&9×“{‡\ËÓ‹Ş¾”k¤šå•Mf¥ñ“:hÃãôZª)Nf´­áÉ¤è[°h‰¢ÜXK‰#’Öyo:V4'¢{ËïBE ¯Êƒñ©—¡ä>‹³Ô@ç(fDr8V´¶½ˆ²îPe¥ë`|¯:á™ÊøòU£…hòU¸êŒ•,j–í—p6Şfş”¶<!`­ñ®IÉ[JÔİÕ5ØÌ’Á’FÃ1[1„a™Ÿv5Ò²4ôÜÉÑ}†+6cÛß /k–2àjÃ<*îıÄÖàr<0ô*[^MÜ¥ ‡@â±8MÀqJétN¿3f™»cºKu9töì†Ğ·OÊ5x×\)-lŞ——ªĞ{6û=ÖI	kÁD`TÈ€0ÂŸ©j$U†3ap{Ş$Šîà„,?!g3ÔS~Dô€ôŒ÷vüLéÄŒkÒ\Ã©:%n¼„Ô<MjfEÕ¼£71Hõ“$á].É˜¤Ó-nƒ›¨’ÈLND­é ×Ä¶ûX\ç‚ç‹@CN±øT¬ŒQF}¾ëÓ%£'
ğ·YQ›ÆÊÏq·hhş‹š@qU>Úº²6-Ù_nr±âGDAÔLO-$œª2c¥ÔY+|Í+{UFÏõ¶œÇ4æx#:‡©üÇ‡S^6iÅÆ1şSĞÇçİhõ;§ê•‹¿mòDÆx”°‘Jñó{5“ü±c¿W¾‡_iİİ¥¸±³m×¡Ó’Œ…áW¡¯?'·^šD´Ê­Õ3LÏu6§°·ÒoşÛAø×¼k.†ÒˆYvùˆäÄWyEs´8%K Ü¼7‚Ê¤£¨hT¸7“ÿ LO.$*š–Øô-w"ÖÇ%©œ®Æ’Ôr‰axıCùÇå5µ4z’ì‡7e/“[¦ÒZ0ZéLF¬[t®hke/'-M•µ*ÌÒ%nÑs¹ó+”  WB¥ŒıTDv+‰^Ù4±qÇâ•KcyQa»Eœ,BX÷»7<ükGXêO¨Ù¶6ÅÑÆåÁÊ€u¨qÜ¥f29lcaºsİÊ1©}ô’İ•}¿Uk‰ş£hàĞ²äqd¢ñ®jú3Hdíğc‘Z}ÁŒ!-\îÌ¢¹ïeØµ_‰¯3Ê°C?•ØzÖ.[èT":ıÒ ÙZÖ“Z+šêÓ¹¢ÒEzÿ Êoæn5ÎënãMekİãóÈNÚP
…MRR†ÎÜL=Ïşy¾³®50ÂK$‰\ÊÓÆ
 $¬ ¸iŒFÌ‘¿¶¥Ğr[+ s‹‡oİYña$bÙú”Îö51Ê+jÕƒb|´©•Ò~b¾Ê‹ÓâU˜Ù·Ì"+Ô¥R’I²&ÍhÙ×@ “Z($ÓÆ…ÑÇ¨M\yÓ”ö7aš	à‹ôöÍ¹à2m:Zƒ2W>•ı›nµ?*¥İ^å}ó·vk»i¤º™°½UšGÌx^_ËZ¶//£<{pÛla•Í†7\Ì	%åºYĞ
ÉÓ%w:ùÕêbÊDvÎkCÙpâCŠ r§I“6GŒş¬L®F’p8ò+f%¡m“Ù‡!iŒ»ÊTÓÆ§R¥Ço$f[›YCâDEÏ’VmÎŒkG¡©e¹îP[ˆäo¦1
ÓæüV¹¯Š³¡Ñ[8Ô¹î÷F"ÁnI&ÄU‡£—Ì†{-¾d¹t-‘EpÌ“Î®·²ÒEj§©ŞÂÒÃylıƒ€è:ºæÖ7ĞÊ–Ãph’Èà5#FÚÛÔ§r8Û±ZÁĞ—E4î‡ş8‡U¨š˜
äkscoî›«[–ê”ÈçbŒë\9|YZ4ÍİoqØ\	´»\ÎR×€ Ò¸”‰GO©VEúpæ¶hîŒxœò /…_=a¡GY$ôCgÑs´µuåSM¹E­Á-´îcß+5Äì©’Ö\¡è\7nÛnSä‘ÀàÑÄeì£Öºz±Õ­JSl¥ñ†ÙË©­Åà„Ç‘ZŞ¾G÷"^)Ø¯q³½Æ(_¤¨4#´ô­+™jÅé½†Éµ·oq<ÂäsÎ—«ÌNÀö´>I¤ìZ×ŒW•$]{¥ı+LmŒ9£ Ä'
Å­M$dP—†ú­Ôç âŠVpÊNw&e´1£¡$8bsıÕŞåB-OREHÓ.AÁÆ•fEd e‹+½Ilqf\¹ÕYJQâk\ÛÚ†°FÅ.D)’×%[5uF}Å¾­¼7R’¸/Oİ]»3µH`uĞiŠ6±Ñ}5„Èã[¶¤Î%ƒl/ÙéËÿ Íúp©ĞšŒÕù$Ö¥K­®Å³9-u5¥ì^Ö´Ït·"Øêú×ûlÍxm´‰ó Ä%zó'¹Ë|MlR’æ{HØıcË<‡'A[V•³ÔÉÊ,Çt"´Œ:M0êÔps£‚m÷Pä„¼„’7P,ùW3MI–¶á‹–Bâ£W0µu»'Š)»ne¹sîšÙ\ò›“‡…mêNˆ‡HÜ£yn²zút""Uz•­ihPejë$r¶hŸpsÒPÊ­C%è6Ò8eFÊD%KÜû‹6¶R{¾Î)_ıiHj+^Ü1¹Õ+´´%Ñî ’ 3:RºˆÇ*Ú¶Èu‰#äƒ$®l`y£8«‡m¹,46v¾A!ŒÃ¤âr	NÕMjR³Z£fîíû`o§etçÀã¨Å!Ô=õçåğéw;3¯•züNßlú½g8aî¹dÊÙmÂ7–"¼¼¾Ö›ÙXìÇæ/‘Ø³¸vÊ&>×pis›©¶îpk±á^5ı¶Ó¼…|„Í+{ÈšÖ™mB+^¨'D®¾5©º6O–Ì—û„itqá‰BPá\-ÇBøŒ†şâpt«Zl|PšıÒIôÆáèæäµy18%¹;™ 1å­âåÊµNÄ¨¸½Ô²\ÓüÆ¶×¹0‹RİÈÀ<ÅüT«Wdª Û\G4ˆøq'5ğ«W]Ô°øìÜÂ¥UIW5ìF¥gw£ZsA–8Vv´ì‹SÔÎ©$¡Y‘åX6hI3çsCP§òŒ1¤Û*4zgı½Gù–±âh†K+Ã°-~l¢Ê†Z¯lä•óñ¬J+É5âD¹¥Õ íômó½]Ã¬Ú›ÂV¸‰Ğ‘:ÖhbÜLÅuÈ)ÌÂ¡ŒkíŞÖy§Ô§8ÔF Êb{hæÉ+š	?c[F„=kg"PHî©PPĞCƒ( «ï¬ãC™²œa Á¤†‡şK}F·ˆ$ãVª&Àûg0­@>QæÃ•TvbÂä_ííl²1Hš^à x +ú&êÉbèl[t'êô¸ú|	Ã*çMÆNùÚï6osX!·c¿­ A÷×FLUtØŒYZ±ËKÛ–ØËh“<¨kÄÏâéùOc~çºí×V“º ¢’^#™®V–§S²{÷É\xœÉ÷%:°{á¼’&‚¥€y³àjÚLÍ3Nßy»k£”´=Ã–	ÃuYªÈÑ#÷¯ |×%å…géñØ®|·ú»›h–ÚS¡äù|:St«ÜJÍlZ´îK»Vˆî˜œO+;xÕ¶Æ•ÌÖæõ®ÿ ú¶ˆı@yÏ!Ë®øüYĞ²r¶{[éõ1¬c	qÁJquÈê„ê™˜şÚÒù¹J8¸`Ml¼…ÔŒ»»gZH1ôKñFâ0ëZ++l& ½lØ½=è¸<uÓ™ƒJµÜ½g¸¾Òİ.&pI9pZÂøù=Š^77áÜm»#ºî>rN r+‚ømÊQÖ®£S~Æßd¸ˆHç4JG”¸ä¹WİÓ5„S¾Ú¢Én~vî§L­½QR3uEo$1JÁíò¶bsä«[9b­’rËÁ+f˜¶h„D¬Ó5z’İ[ZNÖ:@Õ8ÎVË`tL¨ıš+hK q`ö°­kä7¹Åƒh’C))$ø
›eM’©´Í½!k›æiBàO•“±\H.ì£—èÜ ¥}•ÑÚêM‘“m©Ò•/SæÌŒê®Ó%(4í#¼²ZÉ:zW=ã¡ªumÄDšBFkÖ±VkaÁVK7[¼® :@É*^F>%º'+½73F ´ãÏ­iìÌíD@%u¼ÂEr<hôæÕ®Ñ‘mğÚÉ¥F’B‚T
Í2œ÷V“O#£xF©šGÌk¦™FvRg]í÷®rÍ ôÆÁ =:×e3W£9¯™7•—0Àc1Êó5@ñÊºé6Œ-£ƒRI§pd“FÇF˜“ÁM`’èjËú-$¸ptÅ¤¹­¨MÎƒ…%ÄVÏkÌL“Zçáã]I³¤We¤å\èIùxÚ*ıEÜ8‘%i¸y¢£pÇi\©­Ş7$VÄ¸z@–·àUGãT¬‰udtMv­x71×i’Gúg‡ö’‚­'fZ]Y·ÖÛM¤,*<Nt+…©Ø¯µÄ"G™5/5né¨Ñ0ºccg«#8( D£ô×L×èqÌ4¥i©IÁĞí]ÓÜ;£dwfH…¬êrö×Ÿ—ÂÇg+Fuãò¯U£³Û~¨ÙJòw+/I¥ÌÉkÊÏíNï¡ÛÍ¬Îİ¿lÛ¤lıÜN{‚˜œ!q¯/…lLî¦UbÁhğcPsaïƒÆë¹¬¦6Y^Z×)<3çJ …ğ˜šUàª£¬	9+ºæw,pÆ]9aJ©]·eÀˆ:I4;0	ZlCŸ4•õuáÅk9¤Š=ÂQ"½á‘æIÕVÅ:–ß{›ı2x¦"‹X\JÆP] %r¹İÊâR’Wé-g•‡æ<G*lÒ
®‚R2ùób¾Úc‚f:á.tl‹ú›8¹–6‚ÙK´æĞ3ZÊGl’{‚CÛ™RN‹mƒ$ô#
SŸxÓ`GlŞñOÛXÂ’µ#{íšT0 >Å¤ÚE$¶¶ÚÌXğ^4«g"u’h¡‰  (3D8Uı„Á)~F <2¤!Í|ò€ßP7êšM¬%{šRìÁ[Äú°"ô[n¥¸ø“ì4qUWyÚåÚnmc2mú‹¥,òB¿¡Ó•©ùL¦kmA-£oíEœ`842q¬]‹—Cjæ8oìŒ3¡·p{‘=Vº¿,ª±i9k‹3·<ş‘48y‚`Ñá\¨íNQOyíû;øpÆ¶IÜJøŠóóaMÉ×‡'©æ;ßkºâWºk1¯‘0Q\ÖñmU'rÌ›ƒ,vd­µ7+òû¼¼™¯KDUÆ¬+~İH]+u8¦IÒ+;yM¬
	£í'^0?W¤ÿ ¼sÆ§÷É|EèÉ×m^Ú¿LN/c2#Ì¾Î¥<º[àCÂÑû+¹‰eÄ.pbZ§ã]UÉU³1âû¶($Ak!d­ÇI©ãVßpK±­o¸İYFÃ[†*P~…±ÖÆªíh[µî+“'£Æ¨ç;ıU¼zÄ–²³~=£hÜ£_N×=Á!Bç\O%©±ÑÆ¶/`íobY½
(xvxs©ıåÖàğÔæ/;nòÎaêIı6|ÔWes+", ¯½	ôKŞÇÜyR¾«CJYI>á»ChÆ‚
„NA+›folÕ©Q›¤²Â¯Œ® ’~úèô’z£'’uFÍµËnD-»Wº0£Ázqn«iÜİ²™—úr9!n•øWŸ•:•i“ÅnÓ#´X1SÂ³™E"1î‹Ù¬ù	Ó#ßW¢Ôs%	£¾gôO¦¼2ªPÈr‹PÍrÈ¿¦£Nz‚(çI¡†Úø©õš×€T_ßVĞIdIÒ©§‘àaŸ­Ä	xV±“½¦g³I3w >HHPªxfCAsgråj®g:Šµ%·(ÊvÖç´²v€WÊáŠu5Õêö0àØ¹®,+~SğZµtÉâIn"-&ğ#ÚN—)´X•ñ-[ºÖåŞ”ïâŒåáÊ”YAWqÙb”è äÍyWF,¢²Lç¤íË¨£~ƒ©ß—Çš×ròk:œÏ†M­Å£dıi"R|«ÀevÛ%mv9«V·!šşKyn@Å“ğJ¥Y3n§ëÁ+â7 \p8×3£6V‘ŸÑº–GLß—"*e­ŠÑ”îmÆ­qáÉ™©ë…mKÙsX‰CÜ¡¤ü½Aû«­dƒÒK0ÙúmŒ±É¥sãøÖv¼”©”Æç¸ÜN@€p=*ªôĞeYÚæ3È<ğE«L–4[	ƒb5ÄùİujÂã%«OÓ½ÌcÎƒ“‡
è­ä‡X%mÉ¶
HnìjZ’MIínŠÊÿ N2Ë÷—(¤¤Õ‚ØGÿ SgrÖâ­_fu…¢ÚY×MS6öòİ6ÖùŞéã%¬Ó—A\Y¼
äÛCzyV®ú…}ØÜ=±L}'8&¬‚òZñ2{nJkº=yxí£Ğ×†ò•ts‡Œ´’8ø×¨Öç]mW±¡Ì‘³K‘Ã‚ =‹X½GÈÀ”pL¬Ä´´qŸ1qLÏ¾¥î6âŞ‚3Fb“°!´tl>”e à¹SÕ¡HâÇ0¡i%8ãYÙ7Dz¼Ğ«¿ˆ	âiùZ8Ò¥Ô¤BëgHºœ½…edØÈnZQ¯B¸ Æ§ˆÈı¼§V|@^œnp*Tå&€xáâœªatA¾dS’ş5
‡0œÇ³mR‰+gsZŒNJ)É01ò¹uC/jR³D»H ioÎ³M½`J‰£ÍûŒ®öHñ«VesZ—,Qy‡vÚD´¬Ä',kú"®QùéÆÇ1³X»·ÃìXçK¤.sòã‰N•«rÇ¹ÔFÖ\C#ág™ˆ8‚êÕÖQÍ0õ9íÊŞDâ+)B3à+‰³²¥ÛİHÇ2i/50Ã*—©œåÎŞvíl+!ÎáÌşÊ¾Iš%¡µ·6+«1£kÃQ	
0Ã
ãò1,š3J]ÑÉbæ$Q@ÄüÅ1^5àùÜßÒG–º³’İ,æmî»`[>`OØW“ôèv¬Õ±EÓºI4´¿ ¸V*°o%;Û¡nV±ÇÌ{m_-•­¶ÍºûT¾ŒÎÇSys­k×âBÇW©•¸ì¬cÜ!›Yn9àxå]X¼‰ÜÊøÊ²ÂÅ &¡9×W$Ìà„„Œ+Ø”¨øÕ¦(6m7Ûø¡e¤r—Áä®:×-ğU¹hÚ¹ZĞ‘»œ—’zWO ·7pÂ§ÒUÕ9ÜĞ³¹³,tLGæ=B‰…s^–™4«]
W]²ÍÈºGIMD\qã[W7mNEI;râÊiòÆ5iÌ)¬ÊÌ\ZE8÷‡5¢:KB9È8œ)ÛR–SJÂ;{mp¬³HªW/á\'®ÇJÉ¹êûx\qÎ™øcX[Ç—¡¢Í»o{=¯Ç2NnÎñ3jdFÌ2Ú^304¦ âµÈëj³¡5bfÙ±áÍ.^©æÃ‰—s³2çN!Ã5àku–LíRœq>Ì«åÖ¸·|hõ%hO,Î‘ş£‚83`¡ö{“‹´º2pëĞçSjMÜKpåKp!rëX42×ênYc¹£|(®4˜LsÆ#qxÌŒ0¥j€Ém¢p-qfåCğ¥0G-§”ÆĞ­#~ÚÑ2)YØ[‰Ï¨ÂÄã’Ö£3‚}Æ2c[wù‡,k\mu%·ao«óp Õ8`Šòlv××0Ô¸áğåN·µvbâåkŞÖÛÊÆÈˆÕÀáV¼Œ‹©Å^Ç*ıƒp‚C+"pcO0pög^šÏF¢NOJËRWz¬ˆÿ HF ÌàŠÔä‚6MR¸â	*5! óµ[¬‘æÌcŸ¶“ÈÇé¡ƒo|oÔB°àŞ`{)ú‰ âeŞÚz··ÒÀ¥Løg]5´-¯Yf|–Àêk^aS‡l¬bĞÆÚ¡€Ë=«h”Š`Œ:¬ Z¼ı”j9L?ÑÄ¨¸ ­)b„F-ÃXàĞ\G:®RO»Ì€ÄòÜz‚+j36‰ ½ºˆ6'½X1sV©Ãu»¼
u4/K¨‰í÷k¦4‹[‡5Ù¦xšÊø)©W%«³:=£¾÷K1Ü6MyÙ}®–Öº¸üë¥í6ß¨]ÓGêÏ¢âs8/Ø×‹›Ûr×U©ècòémÙÔíû¶ß¸c­v\–¼ËbµwGZ²{3UîŠ6€ ğÏßY‘«šÛS#âE!\CH#ï¬ìËHcIÇVYó©L ŒÎĞòdõ4›Ôp9*==#ãQ„ä{µi\NÏÂ“E$R£,eRè!š˜×+3YñÔIè1ËÓ’øÔ: )–5à¨ CeÂMÈKpkH!q&ŠR:FHn#P¡9/:·P%IZy©CIhMˆd!êÁ$ä˜VvÕ‚Ø``‰!+jÑ@ˆÜëUó—x-J¤±Ë=^Ö8 œ±S¬5Å=¯ßÖ‡å6|‡ïVf	ãÒ×ÃæTÄÂ¶G2pÊ[.ıb×º)0•¸=Ö¼´±·©¥~-ï-ÉkBœOJã²5«ƒ’ÆA¦W4èTn½V³rl™‰½@ €¶v+—3?º³kS¦B®Úó¥æÜ!ùNÆ«qßbÄPŞ‰#C‹—ÿ Øåd›pºõ%2@
q5Ïo·5¯êdßöõ«#7"PÙ0Ğ;ÀWƒåxQoÊ[Çò9-N3x»ŠÕ¢»Y$ pIÖ¼úø÷Z´w<ˆÏ„Êá¥“˜ÁÈÔV6„]u,ÊÆÚBA«+¿0Ä{VŠ9c¶ˆe“!sÉÊ¼ƒ¤šóå[6çBjçÙÙ;\Q1\~LuÓ+EkŠ3Îëbnï2¨Ås×JË:zq©VwÊìÙ ´y½•­Qˆc"2YÃK“)Ue$l_³İ® OT¬lÉO,ëøSØÚ¹Sr.à¶Ü#j4œU5ÅoÔ7õS;µä…ºtêùÁMó:©.¸Ó%½ìÉacM«Æ†c¥k*yiî^#}²çÔÑ9sã0+ª·¬hdêØÈæ`“Ğ()B[ãIãê
ÚÁµöñ†Ç¸’´(C•qß{£¦™ Ş†hXéÀjªW–ñ¹ĞìõëË˜ï…æáMQ×p™,7i‹ô¡ÎÅã“øŠËÕs à¨Û9g‰ĞÉ‘|á‰"¬6ğÚ²q–Dç‡Z®nÌC]xÖ“è·SV©S¸ -Ü%)ê0–®|q«àO3_lË'•àÄ»îöÖm%Ë‹F½tH’4ğ<ëÈ¢õíF©@-ê¢-0ÚÜÄ\Z…<³r˜nVô­Ü\ÒFX'ãÖ·«%¤D]Á‰ÈãÁÙ™Ö‰™2X'Š8ÜÂ·|µ¤’Db”,’cÅ¤…ÒÎ–Øpã dİØXnqè.€p5¥r^ŒNªÚuÖÈı±îs$F>FœO¾½<~O©ÒG‹ˆ,.g’PéÉ1€ p&ŒªÜšïÜ •í„ <…OÙ\ê¯s^HŠşÔLÖ½èƒ [š
¼wkB.c·mîs¢pR1ãû+¥æks%9ìˆ“ş¡¾N`*VµËØR	lmO•¥0ğJÖ¹ˆÏ[9íi$bZIRlÜ™¥ÅÛ\Ïê-Àà«×
!Èœ~‘ã^ øä¼*0ô‹^íMá‚}³ªõR'YˆÜ…¤“ŠœºV¤‰Ğ³kZK
8ğ]rÄ–ÛTDên¢WÃ
·r`9cyÒğ%„Aø­fÙIìeº±«gpæ‘ÁPu®|”­ÔYRÖ®Ìê,> nVnºh–1<}õååöúY~]êy¶[nÛßÛEòG+„RœÁÃÃó2û}ê¶;)åÖÛ7v÷M×Ãtœ‡SÖ¼«àhí®Em‹eÏ`WbŞ`(¬x4Våg¼¼éd¦¦‘´yá(ÇÇ‚&>ì©¸‘<ÄéÇTŒ©+‚!³F1¯‘4†`}´*`=èc˜á…h€‚gÜ¿QcPä½:ÒjXŠ†ædÄ'±ÎÃ˜Í¶à:ü‡ğ¬­‰´4É›¶–!sÔñ>5>‹ê>A’ÙÁ™~+[*4…%ahI#F})ª‘¼ØHeg¢U±$#x“ÀWïHüš¶/m[œW–îÖÂ÷|®àáOb-W&tìÂ7w´@æ• ¥FM®K†G³n¯ôcŠv85Ù9Øfk™YÌÆºLp‡EçÆ4òŠ³”æ·]¢W\~¥ÇT_+ª`Ú¹:«åôw66ßÊÂUÇ…B;ZĞë»œÇdà£:ÖüO5²…í¯ª±¹ÉSÏï­*„q·¶w„ï4Û0 n@Àt­x¨4Wu+]ve³ ıMÏŸ A\+‡&*Û¡ÕO!œ¾íÛlÑêXên8;9Šñ²øn®VÇ¡LíœíÜ[½ŒEFg¤ã¥9×Ä§c¡]™?ß^ï÷F‚¸§Z¬°;šV»Àpn‡,‰›xt¨¶6·-d6,¤½¸2µ@ó7Šô®{:£jË-é†vª#ÈÎU›³L¸EKŞsë13Pı¸V•Ïe¡±¦dßÛËnCZÊµ:WV;«ö«DpÛ<°¸+qÉ  ó«µ*’[o–w884©â–LUºÔu»«:›~ï&;y@k]›¸
òß‡£ºJz3¤c6÷F&%ƒÔhâP×vØëĞ©¸öµü&âÌé”„Ô3Ã€­qùV£‡±ñ+jqfÆ÷l¹!ÇSAEÌ¥zk%r#’Y|n¬`lr9ü‚_…eèu-eèDÛÛ¡p$j˜óÀ#¼i[ˆ)]Ì¶Í½ÛM‚G\T¡ö×‹“«ÓcĞ¦EcU—–îql ™55LÏ½l72 öé\‡İU],¦ëOLÆĞ˜p­û“2ÛIeÍiUPšxÖŠé™º³:I.H3Z<¶Vª‘Ÿ´WU-]™“ƒ,;‚÷orn ¼/ÌFú¼5oôîJÍjîtÌŞ¬ï#k˜sá^u°ÚÔ²&´Ö‚
0*»öTºH&6şH]¸±zŒ+WZêEœ•ì]şYÊ+Æ´µ`‰-_m²>ûIàyS
ªZ7&ÊLÓ¹nV–ÜÅ­£73ğZßÓ¥ŒË“[•? {
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
 ¿AqŸ‘Ç1’øSôZe,‰‚Æõyœ¥eth‰$°eÓ‹ãU¬Õv*$cûl†‘Êk;OPôŒÓc½ŒA˜<BeÊ»pù˜g.L6[‰ïn-®Æ'$!olÕfQÄ2VÍg	dn :A™B¼jmVÁ4†MukëzY¯ûzS­H›DmÑb¾USÀV‹#@êU’ÕíŒÆXàJb|k^d:èCµ„lpO>ZIÓà_;1*¢ŒÖÎÎ  »HËÄó­«c&‡Ûî[¬z5æƒ/m¢cVh¾.a’=O@÷pvÉ+(f’š*Ïl^Cã(3Âµ­ ‹TB'F@qÔ0áMØI‘ÖKê\ª“ˆ„²#$§åL‚X.´°ú¥O3Ò¥¢Ñj,æW8€òq{V¥ÈÔV÷–#Õ²»p ‚©Põ«–ø©}Ñ¢»®Ìé¶ŞöÜ!AtßU£74¡Ni^v_o¬~Sº[[-¯um—D×`¼y7ñm]ÑßO"¬Û·–Îè,R‚Ês[6WObWµà qåXğ(¨éã$#*%İpÒP±Gi+)*X‘×Ç‹œ(QD1•NçJz€ñ$råNµrC²"µƒ\G¨¼±â+_FÂæˆdî;OÍÅyÒ^=˜½DŠ3÷›
7ç\>B¶^Ù—î*Š÷ÓÉ5	AÔÖ«ÃîÌŸ‘&l½Óº8ÔnX“’c]5ğè÷3·“cè7Ü1“Im,‚I@FP¯+õzŸµÔ³kgé^fÖÅpÕn‘Ä5KS>„wí36H\Ã¤( ñ¨´³JÂÔæ­íd|R[8,G\kÇ–UÍeÔë“¨Ú®ëxÛ+µNÌÓ˜4VÒc“=¹¹­é¥Ù9UN°B¯SˆßvÛ‰šÉ,˜UÖ2¦«V;­™­gz]k«ã ’œ«§¡ÇzÃdW|¬‘ú°L ĞH6kh¢/*âàûênØÖåmâæ“oG 0DëJµ{èspÙÈ	d±4µÊX ¦4­Y5­»İ²1–Ïe| œ<rdñëc¢¾MC¸ş“İÌÇ]XDr+#1â+Ï¾'MVÇ]r«¸<úëµ·]åÅ/j«	Sìã\ş¢±¿nã½³‰ĞI	®òàBmdüjİÌš×3J-¿wù".Ò¹€çYeÁÃSJåäjÈc·Ò[#AâJ)â•ÈÓfò[’He€8€
¸‚™µYhğZ ‚ÓÙS-¡Yİ½ÀÌÀÕLr­rÖŒE3.KVÙêõš1­«“–Æ\8°>úáÑ¶8¤-kHÌœª¸-ÊwfÅŸwÉ·Â!›S€A¨ğ^5Ç	]Ê5^D-Nƒi»Û÷vz³–½Ç“Oº¼ìÔ¾7Ml‰/»sm»_DU>n+JNJõaLåw=¾ómqh-9„ñ¯WJäG5êêd»w6Î!Í!ãó>5³ñÕŒÖWSk`îW“ş¾k‡Éñ;X|‰Üé†ëÂ–À°¯?Ñks¯œ’ÚÜ‰$-p .-VY)ÖÒlÇrFˆ¡2®MQVãmê Ìp%kJY¡q0îáBøçbÅ¤-wãÈÖ¨çÉI1YfmîG HS†“å®ÿ QYjr*´Í÷K3! !NeÂ¸Ş4oÊs#×+~5Kˆ¡¾›IdËI)Òµár’û®n¡ˆe%£Õ\9Vu¢³Ô‚¼;ë^};¦´®då;àkZ“[§¸Ë­ºÒèzÒìSğ5Íj¸e¼iìRŠ9ìÇÍƒJ´}¢¶n·:nì€wÎ
«ÅE'¨i[os°!!í9VÀ+•†}Õ“4:]™\±Ë<ëA¦[È™¸BoZ‘° §ZîÇn&\Œ¦í.•CÉŸ0w•x"×KÌ“0ôÈn e‘UsJ†»kKr!Ö6×¾x‘E5•«'%’cr‡€IÄšÔ1•ã²is½Aós	í­9h
£ÿ ¶¸¨Q üS•RÉt*¿oc]ı5w"pVË$™º÷6RDÂüAáˆCZÕ¦CP6Úì±¿Õ¦
F*·°•ÇMqÈ{1\ÒU`Ü27<sNU;>”@Y•Ã”raXÃ#€ÇŸ5­ C_I% €3ñ¦ˆh®ég„êÕ‡q…\"\’[ïW“Ò•3ëQlJ4¼vûµ¼©8b¤fkŠØšÔİ]Öûı·Ús¤æ	ÃİÖ¹ï‚—ú‘½rYlÍİ³½®á:nã%£ó¾úäÉàéùYÕ_-­:;¿h»€¼é¦J‡Â¸mâ[f¥äÔÈ¸îˆß¬[©ÓÁxV«Ûûü¥ĞÈ›¹w7’ÆDş`T¤üÔ^»egîw’RJÖœ†G¾§Ñ]äfÆñ3¦,3;0Æ»1à­VÇ#ÊçrÜ!Ú=S)(1EÙiõ#Šá²Èæ8&xÒu„.@—Æ!‡¾„ô&ÈMå¬ÒÀá†8|jA`Ú¦™šä]\\x
ÎÙUXÒ“ÜïvİÂõÏ–Ú_Jf(fœW©¯ÔQñ\’Ü³k¹[KaÉ28¿p%Ê¨ˆNNŸÔ’w½ÅºK¾^§¥Q=zçØ^Å;ĞN’yÖt:«ª&at;ƒ' T&¹ŒŞ¿š°Uß7QLE\ÄW%êU1÷+3p|Ö­Ğ@P\ë¦–”sÚœlArYi·~£÷8xæ•×E(ÂÍ»	—tlqpr(Ï>U\LÛ7îâeÔ#G9¨9û¸×=·\œt6w7S—±Ä1‡

ä¢µe3JÒßEqŒÉbÙF¾ß·	²1Pê@8ò©v„ÛîD1è– ZĞvXW5”š£=–[5ûœù Ã™|k’Ø*÷GO¯u³8>ñúk´_êšÎ1êb€>Ë^}ğº9«;±çV_˜ó=Ëénñgî,èB‰â*gú‘·åèÎ9ö›å‰"ê'¢£Š€ÈÖ­Ñì™[¼M^™à…yÊ±ôr_¨ÑjÇrc¼åÄ*øVy1v4®C¤Ú·F¾%j €¿Â¼ì¸Úgf;J+îcÕ:œ *¡ÀUˆ›©!ı-¨µ…¥É‹Î.unö’x£t°xÓ'WÂ»0ä]NkÔ­g6åd“€À
Öê·&®Èéöå¸·¢áêÎ,w.>5ægñU–‡f,Ñ¹×¿sÛ·\s·<kËT½ÎI€öÎÓ|KH8ôZ¯İä®ÌF¬Çİ;f½Ş¤HLÇ•ÑÉwÜ‹cUØç%¬ˆB—Êø×bÅÉúmíûƒ5½øğ-Ì‘Î¸3bruÒòø7–ÛÇ¬¸<IB+‡Ğ“¡\³óĞ œ	EuE±:š+Éİ³àöî>ú+hj@Û8µ‚ï!\S"jÖFG^¸³Æ×Ã¥Àjëu3¶36ò)\
âQ1ıõÙL•lÅÕ˜3Á “HÄpyU]RŒ µıhàÅçW4àGZÊu)ìdÌ%{Ë²O˜}EvQ£–Ò.î"~ NqL¨É¶
ähÓŠñ·1N
pÇq[«Ğê®Udg^1âÁ¦N#5äk£2±…İàqgÌÁ†UWª"¶eßÖb’³<Ğ`9ÖKšr‚8®š%Pšx¦t<Bæiş®ß¡Îâ×b‹Y¼VFË"#Ÿl²Üa/qOôçU5ÉjÕY®ƒô-òƒ—Âº•¹:ñ3"ÜßÀ|(
8¼k£Ò”aËStoVrF4½f±5¹«È†Ëi,$/æñ©àÁØ±i=±Œ™»<s¬íW%V ¡zßÔjm¸:J„ ı•ÓG‘u&l¶!Ì-#Ìbº•Ì]ÇZ¸J Äbp<xÖ²gÆ$’9€4†êUSp0I$W8¨8tq€NFÆ%‰Ä\3 .5R¸ĞÑ¬\8™)	ğ‰€r„çšS‰!ı$@ãú²+áC³5¶ÈäÄg«‰©l˜Ô·/ Êt‘–~ïegf™jKü±‡PpˆD4¸—È­Èr»®kˆğ«DI-Ü¬”£‰«ƒ>ÚÎé0M£b=æ(A`E$…sÚ"DNÜ-¯œCiÖ…Š7«%Ë~Ú·¸h³‚çs(V¹®áÂ-)%—je»F¡©€NJ½+šÈĞ‘›SS'óTòPR«5!´‰‘£€8âN¹¯sd‰-Á¤4¦C9×#³e:¤5æ=H2!G_eQ'¶Ù°Z—´Ÿé¼M£59g~¸Ïí©é‡ß^I¹…±J˜'újšĞupZ³Ün¢sm®F‰ˆ.cN$Æ¥6]¨¨v–	¶é¥/Y"óR‰
i`Û:-×g†î05€ˆsÂ¦ôĞºÛ £5“Ó#•Txæklò4`îN6ïv‘¢<®-]T)3Û=ÆílmZZ~ á[ã·gdYòY´Bç+Ø„8ãâEu''-·;6ß~£mÕ
CB‘÷{«-LÒ3-¯=¼@ÄPP¦máQcT¤»¶ÅÄ†yX' Š‹X;AØGm ¨S/Æ¥‘:˜›ÕÃDŠæŞ"²“dn[ÆC¹ªx³kZ|DÌã¸]àéê4J/ˆªµ*¶ƒHïğÏé^İX|€~5Á³ª¹!œ¾÷·Úß7@	3W“—«Ğô±eOsÜûBLQN#%w»•s¼×¦æÜU‘È]ömí™y“W!]ó+mÌŞŠIw¶L€¡ãÃ
w­n‡FêËRïfPN xe‚ÖÁ¯(Æîq¡¯À ÒU¯Òds4"²¦¢àJà•ÍjÁ¢±~+XîJ4ÄpëY;4lª™ãµÇä(İI‹ı•tÊÉ½;ÍeÍ³ƒ¢$€}©Ç
ÒÎ¶3I£^Ï¹&¶ ‡`
;½+–ş2±Ó\ĞnÁÜ6÷Ñè•Ä8æÓ—Zã·j¬©™[……¥Ìğ¤üÃ—*îÃ‘¥ç½d¡-“Ø €¡âŞ½+NS¹AÒ]Ib)ÒS#öÔ,iêiÎLÍ ²DhÈV¹¯S¦¶”nYn@¤O:z.¬«‚øàİ\¼÷8i~—rèk4“NÉîcUàa1…cbŠwóDäpY¯áZâ3¹p"˜ĞÉ9×e/;Rf½1È4´{’º““&4²-)9ûqÆ­X†ˆM¬zK‡”ç…h²2K¹e·qôÊ´üìÇå¶…H÷	K´¹Øx×CÆŒÕÚÍÑöòjôñDPs<+7YnZÊÑxnÖ×á¬Å¤„QÁkŠÔ5Y‰gÛnDzáw”UÌT×2êU±8Ğ£º„YQsÉk¡º½Œ5Eû=ÒF–ÆåÉ:ÖÂ¦ôÊÖ…«‰Y+\\Ï1ŸÊ¢´‚İäË“klÅØ ãˆ=|:×B»F-IFk£-1°•T f8Vô¼™42âŞöÔ2I0ñ¼Å>2.DæRë`æf0Ô8V|ašÎ…ºíñ¸ëŠáS’¥U—æs¥]@D8ÖupjfÍl¡t`MmÈÍ¢6ÄÆ4êksÁsğëV™0@èXçDQª¨iÈ%in}'jZ¥Y!¸$ÑÈ€êÌ®5
­n€ÙuT02+‚âCŠ â ¡¢UË‡9Ê
ªáÇ
É–‹eÄyO ƒdi:¥*JâJ¨­S ­ëœrÏ: ‰,E(ĞqWfÀÔ´ZewÜ¹£IiC–¬hH–ÊÅ²9ş«	ha‘­HH±ı÷t²!¢ml.b³x)n…ú–©§aİ‹+MĞ!Á“‹S‰>Ë—ÅqùMkäw;}¿|Ûn£hiìIi¯1ásí®Z½aŠHŒ‘HÑ’‘Y_èh²#.Yî!“I`@pãYşÜ§b”»¨p\ãUûr â…×åÎW=Œ(Fó¯Ô>	èsìº’ˆÚõ-küÚFdğöU—ÇC©šÖ;Ù¡¾ôå·j4È9­I’´&»îöò[L×Ç˜ó_•¸êÚ3»lGidèˆ.Èpö-5nXoÌlÍoÊì¼}µ…w-êdÊº[zr41ìÁÀa‡SU}hÌFÑİˆŒäHáX«jné(Ó»³¢VÆ½*3†ÛšPŸNÒB¡N˜ó¥c$Ym†/QCÊé¾¹®Í¨ilmg¨Ğö€ĞQÃ#Ò°5²ƒ­d!Íi@ŠÖµ¤œ–¼iİ&í×¯Š=nĞHF MeZÃgZ´ÕÖ›uä¾s.–7ò§âkVÄZ} Œ´JüSõü)L€`4Tó4aE†‹ˆ=K@pXÙÕ‚êèkP—ğ®ø9-¼Y Ì»±·|nih%0TR•áæñÕ3¦pû¯mÇw)scF…'®jd½‡DÎzûµDP—5º	Å¥TŸÖ[IxŒÛ5üOvŸêp@1ö×¨³Ñõ8íÈŠÚòæÖ@ÙAiiã—‰§j«"kfŠÏ`hcÌä=µÅ|šæ5£»mĞPL5ÈëÄÙZHÚ’;Iùó$öSè!?jl¬-È$a‰ñ¡e‚$Î’Şêİú">üG¾ºU•‘‹«E¸/\×5³+Pf1ÓYºv·sSõ,Ğ+CÚˆ ‚SíÆ°‚äÎ½tÿ ²ô3ó-tU4gf>Ì<°±ÅAYİÑè>9gµ˜ÔÕBsë…cz&kf™ İÌæ#NNSë\ºÈjÁ½1£Òáp5Íl«!9º†â"<HÀÔ*´ÆÜ@Ïê–•ü?Uœ!WråÖÖÇÂ^Öâ™'F<Í1Ú‰œÛâ1É¥ù“æ<kÑå'3¬G3O”ü¸ßB±-e±|À¹Ã‚ƒøŠë¦H1¶9FtÖ1±ÁÎhWa’+¥ef/.ÛáVŸ?#‰=0¡gi‰ãLÀ6Áqê5¤ pã<+¯Ô­‘ÏÁ¦t[ÃY#™W‚ñıÕÁ“İtËÜ±-Å½ÛJ¢|z­aTêË³V(##“ÔpT®ÚÚQÎÔU	±Ã)ãÆŸl®û¢]¦0¼çUÄE¸o˜€»	 TÕ`©!Üîóp¡~.+€ğ­U£s80çæÙ¥Îi '­k5°œ¢;MÈúÈåOËÓ•+ãĞ+è#½ˆÄ¡©¡:§ãàÓ:•”
9Ã”93\òû¨zG\=¨B>ÎTêÅb±®j0û8ÕH’ĞÎ»µsÉÓÃ‰áÎ¶¥ÌíB¬vşš¸O>5¯)2âG%ÂÉ¤b3‚ô£¡2ZkâRF¡Ó•Ce¥¡-ª8†ƒŠ¥crÑbdh8G.(µ’Ôlp 	ä3Jcûk}@4 IÄ½ôVÌPG%¼0´–4)â0ªW‘ÁT£ÚZODs°Û˜›ä€ HWv¶Ïy:‰Bˆ´+4&¤£=¤yFPòà=µjì—R³¥ÜƒˆI%¨£U¢‚e£^Ë¹wKfµ“bcl5fµÊÍ~éõ\Ï+—¾°¶k˜Öeİ…ÃAxs² œë–Õ7å'»÷pØß%ïoéHá¢)?!(5÷¯•4|…U2)«Çuär[_F—5üKx/JoPºâÎ©ß§Öíoš	3zÕ&sÁ_uš2hƒ9¤à‚’E¶ÑtÈí]ªO)qnF‹£RÜ7/™Î
Z’HSX²àÄ³º|{”°ÈPHIiá[R‹{zÛ¥“DPeçÖ²t†:dDÛL­½·ı,‡ÂÔWV6sæPäÛ‰öàÇˆaÄc:«è°$šX´°(hÙ\¶6¤&]Û˜ûx‹æ\¸.8µÎÙ½µfõÛLoB«òšìÃ±Ã•js7ìñÏ-n¬^
cX´tUèCqÆ‘!pÁ}•š4G=s‡ÌˆS«W]Á”ØøØÃ¨µG,O¶ªÈw7±Ä 
ãYB7Hk·C#´’8æiñ@E²M ¤¸µ=æ³½SFô³Eù`‰ÍLÜáƒ@D¯7'¬ºæhÉ¿°cDCSÜyÅxÙ½½­úy)˜-ÚıJB…8>5Á|v®Ç]Zf6ñÛ¶®itpËÇ­V/"õzìMñ&qÓl@©Å™‚EzuòkÔâ¶Ğb^X0‡±Àe€@?uWå»:¡°odÒ4‘’qVÀšĞ•êlwXå¯r±0¸2`uG]2"ûÓ–á’Œô5Ï-(f}öÛ!qtCÈ1Ì½Eo'sSSæ+˜KŒOvyu®úÃ9lš!†k€àdà3ËWd‰Mõ4m·G1F @!0D¬-ŠM«h-:î9İˆÏå¬¸A|‡¶ÉòâÂPŒ8çYÛBĞ[aqm£ bxõ¬[LÑ&‹–—Î·yü£ugl\k~æİ¾éjâ<Èz×ğØè­‘nçz…–á àˆ¼’°X-%;£.&Á¸<£Ğ»Jk²LÖ£'µtÒH(xb“dºÁbÜÆZùù•””•÷æÜHÅ¿²¶Å•§c;ã1c2µÅ²,<k±³•#^Óo†æ @Ô£%ÇåÉv™ÕZ&Œ­×ct$¾$nX~×‡ÉMC9²`kc[½„qÈ ÀWL¦s$Çú!Í_1à”Ó´E$/%#P¼}Ü«tÌš/Ú@íÕjÈ|j‡Z’ÙªP+x„çÎš¸Ú!ĞæœSNc­Ä†\˜®¤«:+¡OR™Ù¡™QÀæzøV¾«Ù™ğ3n#šŞMAÚ“øVÕi£;J$²ºr—8éä™-Mñ•KšQî™â5òäMs<nªMUÓĞº+	r“‰JÏSm	Œ~¨(œI¶åK½å©“W‡
ªä%ÔÇ¸²+TsÇİ]*ÒsÚW$q?…1!ĞÜ=¯( !©u‘&Éeº.,Ç<J¤ÊG†¸éi ğ'ñ¤êT35¨)Ï‰¢¸'dÁãK‡İYµHö²=Còëª¥±ÁNkY$yôİ§,¼kZİ#6Š÷vóFÅ$’•uºlVNİgæÁ£*ßC-I˜×„ ã€©l	ÀŠRCs}D”Fëf‡+O›?J‚^Xò2¬Ş¨µ(û¿qÚìwXM½ìM‘„q
ú=ª¬¡£à+gW5pÎ&ëµ¯6RélI¸¶Äçhà:\vÀë¶¨ôkå+ıZ2öİ·{cnŠÄí.vN.äœ+™ÕÄô6ä¹AåwjÛS×:-*êS©Ok´³—hôÖF<«ˆÌÑ—q§¨%Ú¥nÃ¿¢ˆ:q®vÍUF@!ÜÜP5À´'
Û.¦§e¹Ëõ¤&À4¹ŒÄ¯­34â	Õ¾G/ii{Óİ¤!ó ea[Ã=$êuÛ“„op€ãu½O&îv(½'½€0AY4ZfŒíBÅ¹n¤Ö¶†2º+b2r(öVøş’/«0nLÌ.p*UGãY³TFÆ:@L® ‘åiÈxÖeÉJ`Ñ©AÅËˆöUõ"xcÔÖÆ0&‹1¤Z}¿¤Ö¹¥yx×/&ng]mÑµÊÈÜ\¹ªÓäÊ@i1±},xŸ˜™“BëùäşŒo=DbVµ\VåHé£¤‰p(øÓULPU’5 6©qA‚šåÏâÖëc|>D=ÌÛ‹{™•…„&:zWÏæğãdzÔÏ(¢Û@Ù?¨À¦5ædÆÑÑ[¦:ûe¶,ZS!sS%ªÍmTÑÌßöƒİq7HËË’×£Î¨æ·;òí·vR±EË¦>5Ò³×!‹Æê[Û·slLs|ÃëXäÇ;KÁ¨w{i9æmaéÙrL„‹{J`¨
bj¹:‘	‘¾Â2­ Ë2µ~³%Ñ3:}°1åÚ4c^•Ó\ÚéY""U£€r«VLÍ¦\°İ¥„…P™(ÃuÇ%ÖĞl7w†xôÈA<8cÆ¹½™²Èå)¢eËÁcÆ<ª 7#šÊkf’‘ˆÒxÑ#ØÎšşdG<ù¾5­q¢F:ÃxİúT˜‰ùxáÊ•ñU©.—hÛfì'-:±9/JóíS¥^M{{È‹4¨Ô=•Íz´j¬…5Är qü|+*—(…°Fğ¡ªª ñ­=F™$u³¿LïÌĞÜS…;>BJ	§‘·!ÀyR®€õ3Ÿ·C&Àr²Ídfñ¦Qº³|?+‰i8/İ†UÛ7#øàªÏ+I‘¨ş	—·¥tò1U,2M 8”AY;‘µ³q(0)‚Òæ$d–åHL‡ßZ¬„:ŸØU«†'Ã÷VÊé‘Å¡Í× /˜¢ò¡¸ÔMc#šÕ`#â¹Q\©ÆÌKËwÁåÒ™…ıµİK«#šõh‚`sóş`x­^æbêwI§<²&›Æ†¬Í{K÷0¤Ÿ7x×-ñv:isN;˜å*’3®GX:9 Ég­$»‚ç†5>£Ab^Z5!¸k¦·“+TÉ“SHÕëŸï­“2âBç9Ä–œ=â¨˜®æ 2\Çì¤IºÇ˜Ö“B‘Í¸W)Ã"«gj”¬h²é©¥åx
ÁÔÖI$dà\páÎ¢Y{}V€N¦€½pçYL2÷ p‚6  ¸âGï­›&(ÊÖŸ*Ğu­ä†ˆùŠ9ê1²M„˜O=ÉØ°%l„5Ó*Ph™÷¢üxWé'ç¡À‚pCË­ r½Âïíš§µF1Åeòû«Íó/é©=OœÜ3Ü·wMê7#Êê^f"¶zµğñF¯hnâX¥Û.BLªâÒk»&ºœ6G]+ØûgÛ±Ú< ×3yÿ rYIı;ˆHÔÂLÿ …Üë£Ò»~öf<Bå-' :ıõÓs+×C¥fˆç‚£á\ñ©3¡·õ¡„Ä…w'¡ÁtXŠ':Ó—¬Ø“/\Æè¢f‘å^ˆ®[¢)Ü¹-í$ùkzlFÌä®%œÊZNãÓÀV-+a¯FİD $‚¡-J"¼1q#‰Gy”óªı¶ŞŞHõ¼jw3Ék,…¢äöÍŒ$D¹x7ç6Eqcÿ İÔW‚§Â“e(-Ç¶[æhÃ:‰x µg•€ğ5hÎÅ°Ë;T($°O
Ö¶jiG°DcW0bS!J×%hÌÃf·®õ0w1Y5Éu»G'¸ì¬yXœ@p9×_[c¿‘˜×V÷\	`ãš×‹—Âhô±æ]Ág­Å$Å!äkÉÍ‰×¡Ô¬™ák€·N.<s¬)5e=Nbÿ ·ã{”ÁU¹Û^…<—ÔçxQÎßX\Û#‰9wâË[Ö«EMÒâÙæ9ui\Tû+káVZ+´oÚï1J@r
Mq[‘Ñ[¢éš)F=Øç…JL¦Éc´†àkÌ8s©whj©‘\m‘µ‰#çdÃßZW#‘:·6/ˆªytñÙL‰îsŞ°V³¸	Uë¬:Ö¶I¢)f‘¹²v£‰Lˆw:äôÚ7å%g[Ã)%ÃæãÃ>Us nÚİdéf?Î×m‘,)-Gp>ÊÅjjÊº•1ùxÕğLM¶ÜÏªÄàO›øúh]2w:o‰P|5æÛ“²¶CßvÇ\`¿ºŸ¦ÁÙ2H¥kšK^®Ë-@ÒİêŠŞ¼'¼dnhPŸMlÖÂ²2çµ` ³î\:×Er3DV0é Œ’ß]*æ|	Xt4»t›–5]ÍÈaVfF8¯ØVÉ´4ÎÇ”dÊh’8Hd…ÄjjåÆ®ÏAUÿ £1%áÎ°ÕÁJÿ mõŠiyaük|y¸˜ß˜7{c¢aÑãìÏUéâÌ¬Î+bhÊcİo&’xñë]’sÀù.P„R5¤Ë6·Ïhù‰r+šõLŞ¶/·vxÅu‘25ƒÄUÄé„î¢‡ªb
nJóY‡`®|…$tğº?(ÀsÊ¶V’3äÅğ=kTdFnÁC¦\œ	•ÛtèÜ¥İ:UğLÎ`´/Lˆ€’¹ŒMCÇr,Ãzèğ%<¼<k+c.¶.Åºj$(<°Nµ…±«’zí•pL±ü*xÁRHÈØF§€¦¾¡°%c\O^IY¶QğÀpÁİj«fKH}•Ÿ¨Q«É8s§|Uk'İ`òúùÈA<¨‹ïItÂZ¸r¯İoÙî{e1çLtƒW˜¨8ş5òÈêåGz¦µ,	iåB<¯ `kè¼o/ÔP÷<ŒØ8ìvn¼eÍ».Áô°œ
×R9V…yíb»„Ç£ÂªãT‡Ê½ì†ì°¸H€çVœ›İhtñzwI"#²û-AÌØö]şšô30FU½,¥ĞOq×ïª²0ˆ4îDf¹ÇæÁ¿…r´mVen²Giq(×âàMiW»0£kgÊ¤•^ÔA©ÏïwÒ²V@Ğu¤Œ€»°xêË“2¾XpEutd‚8[æ{Î,\—­s^Ùµ-(Ü°µ6¶íÔIyòp^Òjo3Æ¡áX—Ğ’ô°i(yÆÔÌiãò±…0BzÒ4EºS¯\ˆâ¼NB˜Œà¤.R’ÍtÏI@éJÈ”Œ¦Ë+¿˜“Ç$¦´4Ë6éI˜xä´ÛA>×læ h0Ã•em[´sw;!tH¤a^~o‘ßÈƒï··˜©™øW‹›ÅuÙ†<é™ÓZÉnÂÇ5Ì\ÅyÖ¬rsWf		Á$\ ŠÛkS+$c]ì,=m@(3)]”ò]t0¾$Ì)¬.m$¡YÀŒJe]Ë"²0thtW2Äí!ÅyV¥Õ1K6¬7¯MŸÖj9S‚¹ò`s(Ú™ ¿úö\æ	˜áñöÖ.­òLapADaIX ı+eq$SÙZÕd„gÄ§yl#v–€¥ pÀWE/(›T¯7-n'PQÊŸ$BL³’Âà­ ñËÛYY"Ód“Ü´3‡› æòê)V¥;B"ûO
­‰Z6H:|«Z|ÆJ[sx‚c^\<j2Ód1Ë3_åPî:©´ jÌ»ûã ¸yQ†°¶%cU‘¢ìWê…ØgÅøÌµd»«—IÄpL‡ZŒ'”–;–Ücù±L<+;cu)Y2It±^Öç™åN»UyŠ1ášiV„Su¼ŠŠ!E®…ddêT™²Cæ{°<y…oVaeöNs–ğËM&idW5kbÀ‘¡KsçÁ+1ÁNõÁÍ(\1­qØÎç3qnÓ"–àp'*õi}SR”°9®w†Xåã[+Iƒ¨èÎQ*l4JÀZK›û×‘¨f‰šV¨ã¥Àr^µÏsj›YÄğx§Ìêávrt$Qº±‰H1ÚŞ¶fw©‡w`ĞJdpNÔ®s´eÉfèÎ#‰QŸ…n¬CE	íATqë[VÆN¤p5Ñ1C’ñ"›rJ$’fé¡Äš˜&\=àsË¡ LÑ·»Ä*fr5Ïj›VÆ¬WNâ„ğÇ®kTÕ2VÊò dqrÚÉ¢‚ñ#‚œS!Ãß@³šHdÔ˜dGßJõ”U\3î…¯ÔÎ
~ê à{ÎMg@Ä(÷×Ì{Å¿,Gíháˆ-ïé_*{ÏaÒ•„§Ì˜~5ÛãîreØ«o¾\XÉ/¶UCË÷W²¬yî©vÏ½YÌ|˜ën”ñğ®Š]A•±³?rÛâıp¸ˆyéT'øU&mKJÔÓ±¿sØ¯˜ãlœ˜Z¥Ö˜î·8ÃQÅ<Ç—¶¶:ÒúETyÕL˜´XŠä\Aè¼¤€ ÕÌVWCJ¾ä,–Ú8— sâMJª*[úM€¤	¨æ'¹gºé%@q@zŠ÷<d?.ä¬¸“qˆ¢¡PÑÆ¹üº¤¤ßlô6ÆÃY!i"{Í|õô<FÆ´¼Q‹r
É–Œ™#'/_+½âœ›IÛ3´œ@ )¨ä8%Št iU¦Y†Íîv¬Bfnbrëf#ÛÃ…2`¯>ì)¢K’Í
ÂC¸´˜êfÈ¨Iw ²kw5Äµ	Ê¥¨#·¸ˆ–œ+›&4÷.¶u0·ßeÌgC@'
óòøi£¿—g¿ö¥ÄRk¾`U:Wšğñ;ÖEc5–Q4‰"-èyW«©º3æ°õq
œ«Jä€µd¯6ĞÄF1I$— 2ıÕÛ:êsÚwp²¹‰ÅÎ:š0v,•±ÏÅ¢­­ß£qiëYd¤87 İâÄk;2x&5É|Mloêh\‡¸G‚öÂ£‹Éí@)cG˜Œj“‘´†•Ç#–<)0Cn¢kÉb	Psû*Uàn¦sì¤ ‚1ü„šİdF\F9n 5Äáƒx}tBh„Ú4#ÜAòÊä““¿Y¼}9v÷pLÒğXåí¬/FiVY6öÎ Ò©c,İ$S¹±a!±¹QkzØ‹"€·{1sT  ‡:èäŒ ¡u!í8°­Q˜­¯¦b—å#j/Š¬Jí?º<Íj,‡…eè#OU–"Ü#(×!Ã
Íàf‹/rËn#-nœrÁqO
ÏÓe«¢¼äH´â2¢PMœ‘ÁšIiÓøûzU·&EŸRF¹8¡)…D+Y¥ìÅÅ8VÜÙ=&ÿ F+Ÿt3±tÇ´’Ò4®G:ï£9lŒÉZ^N8ñ\‰kª¬çh¢àXåR4ÖÒfHÉp ¹qçCA#ÛpæğAA€9š\QjÆ­¾ğäE<A®+`7YK-ºjşl×ï¬]`®r kÇ˜/iŠëËf!-
~şu½,gddÍo‚NgŠøò®Š³>kt$·`VŠÄ4Q|s×òŸ}i(‚"Â2ı¹g@FâÜUO¿G­+$¸nŞÒ9µÏj—[–·aÄ)êW?us^°tVÒizñ˜ÈúÅUšHØäqo½*tƒÇ1ğ¯ÔOÎDJ4¨áá@oİó>’U‚-|w¼[T}W¶WòÉÊ€ìóAì¯Löö<®8rÎ½yŒ‹ö‡48Œñ\Â×¦™Â?js¡FœF#Ÿ$Â¦u4,ú·²¾Öÿ 7rñ­–^æiv7¢¿·»©ƒáry÷xWeXK›]áù‘‘‚¨*©[N‡=êvRNùspÁ´œÍfñĞN‡'s³ÄUÜuÕo3™¢WÓ¬k¹E[ùX×ç|É–5M	”·»M/#¢êæœ+ĞñrÆ‡6JÉ•´]1·³Š pUQì£Î´×CO±'UúßUÍkNŒpñ¯¼R-Û²âáÚßò‚®¬uehŒmÚyà»‘Í*êh–„\±íİNÍÇ’Râ•ÛIEÇò„ûêÒÅ£rÿ SŸn\ª †Gy<æ2JR¨“1qrdòsÄ!÷Õ4_$\uÜÍò8c‘i¬ÙH¯-ì‘4«|œ ¨L¨’´{„rHWæT+…\ë	c€ßa‘6.Nı!HÚ-Y"¦Tñ[Î\0$áuÃ|G]nÌË­–‚HòòÁ	å\™<N[TÏµ˜¦v†•á–UãäÀêzTÊš3d². .’xıøW#pjµ3¯v-M%¸œ:ê«¦xÜ‡Œã÷’Hõ<yH8İ^•<ŠØÂØŒ©"Ø‚ÿ (æ2T­ù&bÓAŠáĞÈu”à!ÇãC¬¡Löw±¹º$DµËø×&JFÆÕ´–2 ˆ«ËßY­¤#H„j ¼`Ó
æoSN…‹Æ;úo@FDò­éGº2µ‘D[G3‹œqÌáÌWO6ŒâF\mí‘¥Íp `#ÎrÀJ¶’"$·$Ä“úÛ¨İ¥Ä„É
ÑÂ¡ÉšÖ7Ş¢dPåÈ Ú¶“gÓ·˜…¯\œš7I3"ûk‰ÎÔ0\ü2®œyš1½¹,ı†¥¨q®ªä“X(Ëk#ŠÆ¸~^U½lˆâÁœ8*Éø­ShPÍ#Ô$ñ8¾5…­ÕF½”MF¶@'>Cr^ÆÕE×A n 8¾¦¶cu3§`h ƒetÔÉ‚9¸qêC¡JÃõ—'›>|©q€’´öÌ'R”æ|0­hÈjLÉm€rêTÄ­t¦s´Q–5¸!‰ç[&dÑ˜÷É†\«¡#í~¬HÈàh‚Ó²2r4
Í¡—-¯_kG”ŒS:ÂØÓ.¶ƒJ;á©¸â~ÈkŒ×¤¸2T)Èr¡T)º6Ÿ1Åù ÏÛZ¦D¤ƒV^Uâ™UÈš(MâQÁ0éÎ­36Šoª:òåZ+ÑŒ3OæƒTLd`‚…SJk&1­²¢œpåR4h²w"?V¡ÔİX°É’‡0\sº–™÷²×é‡ç€†Æì2
O`G“÷luï‘J¸ø_v´äƒìüÌp`-xé„HdP¯á^Ÿ±Ã›rûZàà£€×yÇÔVúqù´¡nXP–¥=(ï³/ëIŒÕVãÈğ¢Ækr-£¼7¬G®W>6ñ”ğãN¹Y¼™Ûãc¸İÁ7©é½Å8Ù^­n­SšõpzÑŞ-ÜÆú8jû*jàåt*AqÛÑÇÃÙZÚÒ…U÷Xƒ"~_ÍÇ:Î»ˆÉŠá«@+|+hû…ã§ÛœÂÒ?Õ‘ªÄâÄ4cÙÚÈXp%¤ÁZ¬ö5Ç¡·m¼@£IëÒ¼«£­3¨aı=ºşfçYñ"u(6Õ›ƒ×7ÊìAÌ­OGhöo@£—Ëˆ<úÕ¤CÈË–v1µá„{p­3vlÒ’Í€'1I–l{ ÅÇtÇ%qgm	!Ã!ûiÉ$2Á
ê %ecZ²¥Í­³£(ìxøVFé³'ô.| °¡É B†¨ÒM›+I!b8!Ï
D6IuqäÒÌPVÉhJ1fºD9u›FÈÚî'.Ä{)@6AsbÙÚˆ­Ä¯æË…YcÊêaÜíxƒGr"¼l¾,ìN™û6Xá€Àşêğ²ãâwRòVºÙ¡•\à5œPŒW;WcSİ¶hY­‡bœ‡:ìÅä3;Ñ3‡¾³08–<=+ÚÇ“’<ëÖÖİM!¥ 9¯…oÅ39h¹cº½’ Jp'.¾ÊÎø“EVîN²¶\@Ã#Ì.UãÚ­3¹ZQ•w	•Ä¸‡Àäp®Ü7ƒ"8sP8!­,ÓĞ¶Éâ”`Œ\8}…c~ÒØĞ¸üËÏ÷Ğ˜à¯-¶¡€ÏÌœ+Eq4£ó0Ìpi7"€şºxB‚S<zTª&R»Dƒuõ k°)€<yÑé™j!É‚®$eSª’i6È kã@?(¡depFTÑHAÄ¥l¬fÆ7HG`‰€JmÈ‹0^˜Ê.¡áˆëJÔ‘«@éwA%G/ÂqêÅß’åLKvW†<‰#¸l˜â¤ğ)…gjÀ+tµ]’â”¸ƒ±F}Á­%<Âµ®2H)Ä=0#ıGöVë›ÈT¹»j.¬xñöVµ¡•¬eÍ/¨ånk‰LktŒ¤ˆK r1Ê®K,~¬‰ÄçÖ²u*I\íDI#›Ióº¦Õ’•‹-¸|Ú—5‹¡JÄ­”»åB¼xåYµ’Jö5]à£¯ßS#*ËnZ0ü*ùÑFVOáÆ´LÌ«$gŠÑ×*ÒEH@—8©\*@NtÃ‚òåCErnAÁ4ğÎ³t¹ú
¼òækô3áî\–ïã‡¶¢ÿ K.ŠYä{üºïä:¼Â¾Ü\å>ÛÄ¬cFˆ{İ§5ÃÆ¼Ôäë%·k™*óN<+ÔÁ±Á›rKÑ©  ¤(Æ»NN¥A+bÍ8€ÔèPP·<Ÿ¼%sî^G‰	+²jµ99ßåG`â™pRÇÚ^Ïdï^A&XRm­Š=7µ~§LÛkö¬a3*G®¼9#scOTzÇlîV{„ÂH$ –¨V­wÖMnv×ÖŒš Ş(˜TÉ‰Ç¾Ã˜ì”’ÌVÜ‚˜dµsCqÃ|ğ©Bfb1:6€£0ìBq¥r–ä°[8HF%åá\÷GElië/…184‚µ1 Ûƒ¾rsä¼Å	ä±­w·ªjŒ“!m›X<¡dÒc3&œÇ/¦F2JRlé.44†•Õ–Òlj²bÍ$“\‚ ø'Z“T ³;^ØÀo‰áHKs
Rõ$¨$®uLÑmf7ƒ.|?}K,ÙŠê	#(G€ÌTõ!£>õ±»ùy¥l‚F{íËšK† 8ñ¨lÙ‹]Ğa§Æ‘DÑ^HÒC¾UD4	È#¸n%Úµ“ªe'tÖŞ–-ÀŒ½µÁ›ÅVG^<ÍÇ˜ÉÀ`kÄÍíílzTÏ;™[¥“&Á­pÅ+ÌxÒ¬™ÀoÔáå£ÏÃÙ]8spz˜ßœ]Õ‹íß¢QDƒŸá^µnš8­X*L@-ùÆg¥o]L…›Íñ81QÃ‡:çË…3Zdƒ¢‚v\5ªAUÔ˜§yÖN§RrJmØäó—úÔsch‡ÓÖW öòÀÑXP'@ SŸ8¥84, Ö€µuñıµKAu©qÖ1ƒ«˜'½•Ÿ¨Í8"¥ÆØÉA\ùYV”ÌÑ™3mnŒ‚AsFGuW,˜:429¥´vSNUMH“h±ıŞ2KIV¢N*j}6_0ÇpÉˆ{Qpt5M@¦I¤dO\z¯+:·#hÏ°.Œ@Ã¯ï®™3`-/i$UIÃ:x§+™Ï]•¶†·qcH\sN‚¦ãA–íÈ@ğ>Š 3eq*I$ä+dÌš+<8`MtQ˜´UÈ€¤¦^Ö¦LÁ\i‚#sQÉ9‹vñ’„
„uåQfR-ˆ•^Dp¬¤ekˆ]¢q&"(ŞğKSÍ…8ì.ò€>\qÆÈÑ2ìrµ˜FkÆ±u4V$t­g§ÛŠªb
ä0Û‡4©;¥
_dª OÙT®JÚ–´¹&+V¬edQ{C]–'5Â¶FcS sáLDNiÃ€ã@™ú¿Â¾ìø¢½üšm^yMe•şVk‹ê<sz˜ÉF`’:Wçe§+>ãŠ#WÈœpÊä©¹nİîtªÃ¥zxYçå$½“J7Šbs®ãœÍ½xu¾‘óupUZƒØñ¾á¹wëˆ'æ$bœøTd"†-ûF–<'‡ŠšA.×n„…šÓ`G¸F|è“¤Ù;·pØîY,R;Óa
ĞqÂ´­ÚØP›Ôúµşªí;ÔyZÉC@<
€˜Šİf]N{xıQrîæ‰İ<'\gZVºUô2j¿YúhŞIR€@ûkTäÍÔµ³Ü‰$/'ˆ9­6(ƒ®²€Lí,8'¿¢ÖA0>ãn{ÀPæœÖ§CZÚQÚì¶BF‚ÔÁz­R©Ï{K|í@´ãQm
ª(2)Ê¡3R#fÇÉ¨¥C)3>údÜ².jP067ÓŸO"ÊóS7â áNE‹wµ\XqT»£DŒÄ‘È'™&´­‘mÃy4}ë†uz2KGp2ç‡:!‹P\b9ÛY½@|1Î|¥9ğ+Q%Hã¶;BóR
Æ|öòÄâæ“Å¹’äkn›¢@Gúh¯éµ²33˜ËãSlišW#Ey´·ÊZÅ\+ÍËâ¦uÓ8ã¶Á<%ø)ç€5àù"˜G¡LÜ–§›÷~ÈÖæ7šóÆŸK&<4y½ı¼‘’ÒÓÌW«CÏ²3òT;U™”š–×òB[æò9öW5ñ«ÖğlÛn,.s¥1ä?}qÛ6W5í‹e8!.5´6LöñœF'¦8u¬UË'¶“ÑæŞ}+;9f‰À÷İ±®¥O >)B¬¡òDğÈ$à?
‘§#$ôÜ­pıŞ4ä
;[_Gg‡kZæhÊÔG)ºÙ\Û< W‡¶½\+u¡Éu|;…ÌiùrL«ªØ“D+4\nìPf	ç–‹Ä‡ê ‹¦½ãÏ‰å×4*@;É3âÜÔæI ’':WÈATÀ'JÑhKe¨­#HâJÒvÒMdl»}À:´ëi8t4W-f	u†B" ¸â õ«å#âE%»IÁª3R3çW\„4Šîµu&bkZ¬¦nˆgéT ¨zà*½bx›.¢x%5ñ’¶3Oœ“Æ	šì19`V“bcdÒ@ ª/\©lIFxËN¥Å}™Vµbñ8â™ñ_
›Œ´é(%/*Í#I#W¤j !¡ LÔ‚rSIWq&±²“J²ãQß2 îk2ä©sJ¡UÉpñğ¦™™™%©q!
ŒÇÆµW‚JæÉìKrÌkEtGˆeˆÆ—{Æ¢rLÿÙ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ÿØÿá Exif  II*            ÿì Ducky     F  ÿáƒhttp://ns.adobe.com/xap/1.0/ <?xpacket begin="ï»¿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:OriginalDocumentID="7B82E3F21DCA6FF3A89A72C54E7129C6" xmpMM:DocumentID="xmp.did:03173E8034E811E5ABE1BA3808606095" xmpMM:InstanceID="xmp.iid:03173E7F34E811E5ABE1BA3808606095" xmp:CreatorTool="Adobe Photoshop CC 2014 (Macintosh)"> <xmpMM:DerivedFrom stRef:instanceID="xmp.iid:698c7682-d927-4600-8c6f-1e387a917e4b" stRef:documentID="adobe:docid:photoshop:4f806646-802d-1177-ad1c-fb8e62911afb"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>ÿî Adobe dÀ   ÿÛ „ 
				




ÿÀ XX ÿÄ ´             	           !1AQaq"‘¡2ğ±ÁÑBá#ñRbr3‚’$¢C%²Sc4DÂ5F“dE&'    !1AQa2q"ğ‘¡±RÁÑáBbrñ$ÿÚ   ? ö›«)¢Ï%2<eï€@ áL`®$
`] bN³€`R©/Å`ˆ?WLóHf€|U" U Ï«÷ÁO)x †	O¹ üD û 	áL< (&ªrHO¥h3ñ€Né!ì™€zIQ$Ä}Ğ	S„ E¬ @OÊ© b]úL U”Í@ Yš~0©ûÖ”€I«õ€g#/Â5Ãã ÁZPÈç %=Ğ	¸U1Àš¦2˜Mua3ÓÆLÄÛ‘€aqEZş= 2Id< +€!Là$N¨'”’éC(i3 f¿t P*K¤ RdÀ3‘*‡ ˜I€‹})JÌRpËÄOEu``‹«UŠ ‰™€)àÏXa?§„  *¤T¬–3&p¯œÖ°P‚½`U+ì_¾©L‡¶ s2EŸHTQJW( ¨ê`’¤ÀÃò€R%’Ó¹Z9eÒ 8^‚QAA*	¦ }¥ ès3R*< PëÒ¨–@ÒYĞ	”+%ªu€E@\Òx¯„µ¥H\Î İF¢© &dJk8‚ç3Œığ ):)0.( øÖ I”Wò€
Ê‰ “H’ğøS¦h5K@ Ê‚N3–®455€rQPj°©*
lk#Rq€–d~PI Ô<E` xşk^†I*PşŸê°„v¤ e!2’€‰ Èã€Ø	J¥:À)!1  ^†³Ÿœ rŸŞV (J\¾ø Š hû, 	Eª@ H4óIÈÀ2}XJ˜À ¤¾ïÊ *¡qÀ@)L&D L:“?°€`Ï~ø‹2 $×Ê%dVaMDSG˜`‹ óOˆÑ`59x@á¢ÒYˆT3YÓ(fD3 ¢b‚™©˜Ìà™ˆ• PPPP5I@?J
 óü`éi5„À2ÆôÎVSA ™ÀÌ ^½:@@W:şPRŸî°ú>!‘	A$‰´K$€Z§)NK8 3‰…–s€&™‚Q|b¹ŸQ”Q&”#h®$Ê$M0Q/€b`f(N0"fT‘YÀ2$f²ü` J$„ªŸi@-8ˆœä½:À0B{§ ¦ç–de0‚X‚q€¸Z'–'Î aHS"$Œ ³)Jiç #´šø˜j@† A#0p”§Ö EQBJ*á ë'*­	À
§9\Ï” 	æp+øÀ0à*J™”À2Fç)@%PÀŸh€mUS,¼`$/ê&¾P^µYJ¢©PI÷@"&G§²¦ (2ÊP§$Yá ª«MGú@H¢Ü²" ûe G²“æ0ü püàGB>ø  WêJşp(€4Æ ‡À.PÏ‰©ü —R™e ˆª&¢À4Úá! 5U	ÂMõ03ö@*œÎhE'ø@}Y!5û$ ¤	çOë ©	ë%0äq¡¬ÔB9:—Œé—Ü`D Ò	.R¦œ2Ï.° Qåˆ€BXz§â 
¡ ë ñ˜Tâ°
U¤!0eŠ§H š“3×ˆÉ((Ğ’"…ë È™Ñkà`©P}T`¬– ¸O¬‹@@’S‚Ê4
•ª uÄÔÀ*ÿ Â0I}ŒP“ÒÉ+5Ã( hG!€ I%)á 9Hà©„ ª•ò"+0d†½€Q~¼`Â¶R¤ªÖaA€C	pe)ËÆ  !¤"b¹¬ ¢mlÀ€ 2
•v}' ÁDúR	 ¡\Jœ: … “\:~PzgÖ  ´…Oßå úaIËÊ ¥Ì¨D1€&„¨2H2$™§D€V_iÀ~SÓšÀ%áE—Ø@5@µ<`˜"îÏñBJ'EÒá)õZˆ0fT- "kã zé  JÏ…`¤Œıé ÆäD’‘I4ÑDÀà© ÿ áIç Kq—„R„	ã Là) L)Ã²@*ª=°PaœàÊ}¢p‡Ù ‰Q‚ı– ÈL<³€RpôÈLÖ šWÏú@#ê\AÏßÉPˆ¤ICÖ CLÊ°#åšŒ` LĞÈÀ©5(SmMzÀ?ˆ2ÕHªc÷@!#2k ÉR’9âŸé aêÀûV YÕpò€@Ğ>ÙÀ5 OÒº:ˆ‰3\Ä¬ÍªÀ" EU¦qBWHËóÃÊ 3& =O¿8¥JQ¾â˜@#IjÀ"€%}‹ ˆr’d’+•BÖ ,SˆÉ`³ÒJŠ@"Š¦YŒ@\&¡¦e¸š’¡˜@¸À¡ŞA<`B‚z´€@ÉQSÎpõRY„ü ‘êŠL+P=9A'Òª³"°	
•óËÙ!A¦¸a $¸ã ™•¨ş°!eç’À¥J•œPPR© Ğxi€U
rò€1•1I}Œ
@QA\eœ kÿ N°„öc8
K¬†0	&1& ÂG`¡Tş°Ê´Ï Ğgˆ¤à”$xƒã g$Ò`Kª+öÎ 'PZ&"b *i‡ô€Š Pqô€•$Ê½`:cå '°$†ÒœA§ãã ;Øs4)„ ®Yšc”7™Ó¢Õœdˆ³’5X h'O8 U1 é ¦QL§Ô‰ÖPH|X@9<] :IgQ !âŸ² –gá”P	T—`ü+êËò€€êè€¬²H ˜œ &h¨gX	Å(³¬@2’¢ÌÀJ¦£©IJrYc Jˆ¦„‰HI	ú§æ"…&€RCñÂ Çö0 ô„"YåŠ1Ãú@9„I¿8AíR(`Ì  â "„fr8 J…»Î&Òxÿ Hª¤†	E€¸B˜ªËÊ"›½R¡\"@'<²Š€OÀ¢0 Zª$(GûZ
¯H	OÇÛ PP4ñ0
b†˜À5(‚D{Ğ•Âš-&PÖXK©Nnòp¬’S)ï€~áNŠKÂ @ğ0¢G/mi ş ´0ÓC÷x@<0=ĞÍ !¸% 	)š“÷ˆ ®©‚”#‹#5Uûà­eT€&H?dæ“Äu€D  2‹ (¡’t€@!P“–F8	¯™t€“¤½dR¢Ÿ´% ¯FÒY@Ø˜À%Ï” ¬ó€bS•P
j˜È¹À2€È”>ÏVCíí€Œf1Pj¨¦‹  LÏ<à
…IÓ8”O8 •Íİ øpÉ öA&~Ü” 
/û}¢ Éûà³^ @tš‘80PI iN¢(%*1è°á’t#ë åP<`	MB4M0€JLşïé /ZÔÀ/‡V=GœIÀ‘Š ™PJr‘0ZJa(°M©_¼À9”%“¤]¤'¢/º(AV‘?âirU¤  ©5˜BÁD{?‚â£UFJ1Æ&$„7ïÆ*@•ÀÊ	¢zÀIdµmP@6¯Å\ğ_‹?Ô&p
RAéËò€`J=‚  #A5÷° œÅ:ÖP†’™•€1qñş°7õx.¢ YÎ`aá )>xX ‚V@´ML Ğª¸}Ø@2
QHS(Ô× æLı˜xcÈ,Y¸’>è¤×¥0€T*pšyÀ35ëX¢@cO(3˜5&	¢=ğ`'‚À’RpJb„À4 &©øÀ"•3ÈøÀ$O« ú‚MqÇ(JÄã ÅMg  BA Êƒ0¡Å »ßã Ï¸U:t€êq€Db’&P ®u€
…¯…`Àq™€&¥Ë ‘(ˆ Ç¬:„óÃÎ P¾f Äƒöõõ%@X! €¨O•”ÔDÆ',  <`gHª@Ï)Õ‚`À19ˆ’ü h8Ë *”_Uz$Ò8}ëœe!—Ş‘@(HÀS?€T'•s€dILÀ§‘€$IÅg ŠG„çQ„Iê~0:³Ç	˜¢íNpŒÊ¢
á8#4W.±T‘+â< ©IFU#! D‘Z$©ö¤•HóÆpPSZTŸC È”Á”È)/·Xâ%„ÿ -@™ä`)T4ÌÀšÈ‰Ÿë  hOûˆ‰„ºøxÀh: ‚Gİ é:¤–H9ã  ‘ZTÀ5E'Ætÿ H ?i€0	™€Î‹ïÁ %(‰‚{`5.¡Àc ¦F_dB€{N`À iP°BŠg˜é YÌô€| 
‚P"Éø@$\Pÿ »À%GM:,ığHzTR«§DÉ`T'ÉÊ EÅ)! Lµ3öJ j&Ó„ÔO	Ëì°™R˜ 'ş,èe„%g:LıÉç  R@ÔÀ2Š‚®ü "¦e)€€Lªƒå4€ 
†P§ş© €DúsD3üà3 ç< œ²¨Í`³Æ Å©€ˆ	7aÖ :ARŒ0€”şŸ” dfhÙI`Q!^¿”2N8À)Ö ªâz@D5¤Sp`…šĞ@E0_Á<ÌPSÕ"OT¸¬–¾8 
ËÓƒ½Ğ	Í(MRœ-@®¤Ç¶U2Äá, =}hiÕ+8
ÊDÁWPÎ‘Eó¦°Sœ½’0A¤¯^™@tä@ë ÀÂK‡XŠ`„œÂ( ¥DÓ …BGI'á JRÈÀ.“P1€©d„cŒü BŠ
ÖsX\}“€$%S JƒÃ¨Çí”  ×ïò€	2Ò´ ÂSòûN PU=OHşY­<à!&€HÂ ˜€{ #J10«(	qÆzqÆ‘•r2¤(	@9á\L0r‘H^0ÉEk:y¬"_p€u¥rHª@¨4€´3Zu€4ÉU',e ÑUÙ\ Xà¸@: ?cXMJøÒ”øVX
~0Å?Òqé”j>"g A‘®Y€I$°œŒ’‰‚R ıA+ „ñ§„öbL¦38À¥0ÄSÆ© IËOã è³ë 	‘çñV 
²üºÀ$Àô¨€h$ZJÍpJRj`Ó3‚ fORØ©¾0	%N (Ìê§‡†p $8 <2ğŠ•b˜_8¡R`Ë $Å0CÔç °Ì×ì°  L3€Œ¤¹¢gÒ(œ= –s&´ˆÒ(z˜ "…RYøÀI	*&µ0	Ä@„Mi HRüÒÉ@%?Ö
`ÌÌ“Œ0Aò0ğŠ~XÀH”)í(“Î•3Ë€ ¬ëŒ˜©3ö‡ï9À0I ŠTc •Lé_°€ktÎ.fS® M>>Á ú ÿ H
"Ìt€h¦rñò€D…%:@%R ÒPÍ10LDÒ<`D¬`L`MHGYø@AQ€¤–Jk?|’¨óm S:Pˆ „Ob¯XP©U5óé .¥ Î~Fi 4TĞÌ(™V Å$J+S 9UqÈÒ ªbzb	
(õS€æ´ëœ!AĞ9À*U_i€$$Uœ,qN†PèU)?Æ ÉJ‰Ïd BTKÚ`=&yŒ *–˜ISÄ@Bº|z@$(Š ™a*:‹ø@%P³šŸ8PÖ‰ö¬ ¨uP
˜ Rii P‰b“÷À ¾¤¤Ôş0	W< ©”’¸¡0­zŒâ†}BT™Á8“˜œ) E|OŒD$ÌŒ…bæ‘B+íÄ’H¬³pr'T35€®¨”Šå(€TB	8"R’ôˆ¥Yû ®cBK8T4®qDĞ‡	õDIA*g"Ì 4Ä~pRR’*ì €c"„ûü Õ@\º@
”ê½AÀã ÌÊ	À r­  ë_ -^duÊ j'Rk Úé&äò€'9‰ã_(ŒêdµEÂS—LñXJÖ© ÿ Åà”’Le R³ëHMc2ª$$XTâ}:ùÀ	¦F‰0ß !C¼	€T*Ör€hUˆÃíH É&u~' €Hé)
:À””°L ”4\DC4©AŸ¾ šO% ¢ª"t€&åÎ€¯ºÌÈ¹MèS/‹ 9/€H +Lª0ÃÎ 2Ë/õU€GÓYJ@ıĞ©BLôé ÚJ®>şáƒºU  PœM%‰­ 
"…ã  T8!À¢uÍ2€kQŸœ?í‘`2@ò\ ÉÌÀ"Hœ×îÂ ’iÊT€´ÓÈ@#¤øæ0€Õ=´€‰¤ÓUVÍd'‰ë Ğ˜bp
`ú«YO¤D°IŠ ŠÓÆ ‘$:g”@ˆ
(:şp¡*S¢$7Û¬t	€+"²Lã*$Œ|§ PVuÇì4Íd¤Ë3 È úŠ“È"e9şqR†J½h±PÁ¢xNN õ%` I®Yˆñ)©¢,às$I3€ej£(të ) T…+ã fã$Ã( ”’¦ Rh`Eœğò0Ô³” Fh 2(WÈÀ?o(=2‘UBgå LTøKğ€H œæ IÆ•) ¦VD…Pzt€baTL)÷u€RI"°	0péöğ€R–XÊ U>0’“—¾
A™3É`‹Óİ *Lÿ âÆ DS¦ xt€–(&ÔIÀDHL'º…*L“Ù è¡é Œ«.°	\W† R	$’	À'©r•`CêÃò€F“T2>P«	€ (+>° S¿Œ@*ÊÃZMÆ™xb” S:eåÒ©e)¨ñé ¨»4é 2ÌNñ ¢™ªõ€f@}Øø@&”ì0˜+)ëã bg7U3Ê!=Cqj³éŸ” A™£
õ€‰BÉj?¨€eJ à
H¢c #Ô(FQA"©Œ§HFAMP@"
¨(³¾ø
£2>•:( ª$àÉ2üü À¨$gR2˜œ f¤O,ÁˆªPáá”TFe5‰-V%÷`š’z’R
¤LS †ZË¬¥ ŠÓ3’@<çÓÌ@<hŠ`œŒÉÂ 
ˆjzu€•g,H¨€',	œ* ó8A¡€r¯HT"ü ES™• #ÿ )$™@9I4Õ? i]XıË †
e9R•$ğ€T
¤…ó>j¬ıË 'Eš¢hHS÷Ê D"¢dk IŠdkç I©ë ‡2qÁ`	­¡ñ€=)JR(öQBÀ$!Q‚Ñ`$jKŠ 3Og”  'îZ¬5ğ&(—œ†0+áXK¦% ªŸ€:ãöÎ E÷Ì@ªi:ËÙ ê(<r€A
§´ÒÍŸœñœ N§,R Rb³X /€¤  )Ytœ U=¹@kI@hxÒ)I ZKï€<q¡ÏÊ‰–} €Dä$QLéIb™ÀJt8À%™$a8€:¬Pdp8tR"ø@"Iÿ ‡íŒ á0Ò&g¤`< *‚Š“Éc*m=kQã„ÂM 	 È>FŸÒ šQ è ’`Oé"¦Ò®P¸ÒqB2‘5+_ ©pIS€GLÁŒ«IqÁ&hBÁÌ900S4H*@¬Ò«á ¥ªú“—XK*š@H¤Öª Ğ‰VPsAA‚À5¡§L  µ÷xÀ0ˆJ&Iï€Jpü`S{Á€&kSB`¡ø²€sıT4ò€I‡LP¤VÈø@' ä\`Èô™x@0¨1Lå8Z¢À$×¨€
e>˜$@gújN) ÓRU8xc ¤²8ÿ HêU3Ì@“ …Y@
`B‡I…‘4ê°C8SR&]N=`	"cñ€$)Œë *	Lk 6SQ?`ë ’Jˆ``BNµ”I ş¾0 Bfâ*`
rÔTN J–¡!+” I dÛ8‚dƒı  …1°|iãã M+N“ò€g’À H°0áA€0ê”Óñ€ˆË" VpZ¸`  ²Ä@•]Š@D%$W8¡kEZ 5Â *ªt UU¨œ@ŒÄ‚43öxE
aÖ J“3$Ë¤e@_…HÃÌM(ã×<„@€}’ )#R)3Qã è
I(< °©šR_„4D®>øqÁ8¡L.-m"JºLd’áJÀë€€b}Gé€è†HAD§Xép+ÿ ›¬Zc” )YıĞ	4ñ'  2ñ0 (ô×( JDÓâ€2‡ğ€¤ûSÆ 2EÀV $¨"fŸœ’âdTR&•š`| %,'„à³ûR"x‰¯Œ “d'ÒP••DÖµÂ ÈƒZƒHu$Ò²AÄ$ÇôHùÓ< áJÔu$	T³¬ €ËyventSources;
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
  0 À¢«.°±ü0”9PN rı³€„D
|Àªu€A KíœY	 éJ¨44œ j„ÌáŒ „Ú‘Ri Ñr§X@Àû`‘JQg×8ªGªf¢PD%N å ¤Nªô¤ª§#( €²©ü`'„‚uZ“%­`Ì{< V 9@2  g[BSî€@NTğŠ §ÔˆØ@JJ™Ô¡LRJ? @‚kŠ¡C#‰ñˆ©Ns™ªÁ$c™ü#*=È})1?‹, ª‚åB"€ ¨G^ 
4ñ
æÈĞ!Îè IJHPå |3O<¢†‘ˆÈeÖ çúgX ÓêFªã ÀB µ0ÌÒ²8À äÏ*@¦€%‚fV’ÆªÄÒ Ä  °$Íkç ÇñÊ BJâË¬ÄÎ )0¤y”€V°	¦XÀ%$Ê‡¦P(‘ôş OÔ':V t¼åÒL¬şÕ€İĞ@9áœ‰3€¾„ãŸŒ:T%qXjI”« Ì¤³U$c P‚UA Š‚ÉÎ†°	BC ÑÀ¬JJhJ‰J©^½8 ¢Î„bV «LúJ LÍÒ ’*Ï¦y@DÄò€˜S#¦0AÉ/õœ”š~Æ TrŸ\ 
®YáÒP @†‰"Oİ ë¦³€œW€kˆ’â•€@¸"åŒ ´& 
áªá( ¨Ã OJg)y@)Ğ"”AH ÿ Y•€@‚ rš@D‚¤
ºƒ?>…5R‰íÂ$LÉAÀËËúÅSÆp3>p#j@Àˆ!!5IúS<bŠİ(µÿ HŠ‰>ÃCâb$E”ê¢ b¥U	^†(r8úªN(@@1ˆI²üğŒS/Î(i”Ã„åá %	\< 
¹P Š‰( €Uˆ¢`…!Sì‘Pü‚N
sŸú@
dqÇÆĞ^ª°4|'ÛŒ5+ùÒ¡*†~=zÀ
OŞ#	a9l¤°¨è`ÑŞ(L–”’• DEUœ ÍTÌ½`R²Á‰¨tÁ?„
B¨LĞ‚j)š@$’×Æ Y¨­GHU§ï0 YáI ,¨«ö0Ó4¦z$ ©LUzÀ£ xĞøô§3QEH%ª¥1€b‚¿|ªÀ2]«ÒB’V ¡—²PÕ$ö@L³™ÈÀ!"„ø3(	e.€X 	ôé #q ÌÀ$˜	%Ã8(’+\S €T¯N™À.«5‘ş‰’
ÿ XáÁr8 MTÉf+ Š)ŸS÷@ <— $µ&¸(ÂÈÊ`g Ä¦dELPeÔŸ§á /ªB¢RŸŒ!
ùÀ|©#ã6‚è±@¡ $Êe Š%*Ò`©%WÀJ2 £’8DdDPÁ@—A4öÄ&¥*ˆ0ŠÏ_÷ägH¢RtüüºAœ¾Ôˆ¦¡I44€ Ä	$Š~¨25Ê(%D¥^‘€ô„òÿ X¨}4Œ°¯·„É=´€`2ğ€©¨+/3%€M¬¼Âe ‚"“3 Ñ¥
û 	û0€`O1ô€(*£ş¸À‘÷®0ÈÖs  WÊ(OÆpŠõf`ª•Q Pªtœ@I“ºû© ª¯S  ñÂ~ŸÂ A_‹¦@#îUl½âÌ¬‚å’À43HPÀ/ÒUOá “jøô€©@AIû0€0:¼TJ!E§ÛÎ B~,qHLè¹õ…%LŒ TÆĞÊI DÂ¥<ğ€’jÇ)@D¢HH…ÓX‹ãöHFFe|‰€eTS([Rf’é °¢$ñ›±€&’ñ€MV'é5EÎ èpšŒ JŒÀ€õ²À2}HrQ€ŒÁ{1 –H™ü`ùÌä ¬ÂMeB`™Oo²(S*²§úÀ“8­ $u:r+OÂ‚Ÿ/H	!d1DÎ ÀÔN½j` d®(rÃÎ *¤§‘2H¢A$³»¬P¦1WT&Y@ Õó¬ „… A£âSDªÂ¨ø›%(
 öAHÍ'™€rø €`¢À9Ï¸À"Ô)»ÂX*¡0„¨*èÈ”
« Ê‰³š(ó0 Brt%C_qÎ¨´WÓh†`ĞşI Hb ã T§±=T¢Nf¤®e&'4Î°ÃÒ (†H«:ÀDÎXWÂÉJ<zÀ,Ì¿Ü Jqê 19&" “¨?ü9ÀyÏ¤ ä¢~P8¡QŒ
fˆH€j³ZùÀ
Tš*À
A AO ®t€¦²€IB˜N ˜¡ûÁ€b}IûÄ€%fª "£âË/ÆĞ¤Ö T%©€Õâ$0	@
Àp©fI Ğƒ_ 2€	U”ıÉ}ùa U¨tH@ ‘÷À)Ì{†F Ä^«X
…8ÈV°«F Ğã( Èªçà #! f*O`x4“1ªbG¨Š
 ı5¥?ƒI#İ)™/§‡²0 ¥™ü ^•’ç ©ÌÏÆ€@IÖ•#Æér%zRY,EJ/ÛÙ!ñ1Ğu€(õ2)ì†A,'L"‡5Iôüb ™
á!øEER?(!ÔÉ	3Qœúgˆ‚d´•2€‰ŠçãÒ (:(¬°€e~PJD¬ pŸH(E%_œÑNiå €§ÚS€$† @?ùI\à ™O®b S u¡šÀêÈ@˜V ©ó"s€jDñÍ "Hƒâ?)úf<àBf@4#ğ€ A0«   ûh 	Š €8‰d(`™”À€ Èœç º*b½ Ğu€$‹„Ödòñ€iàHÎåŠNp	t„óH !†^?Œññ8)€ªœIœ ?” •Ä‚¦~È ¬Ôu'¬'*¾ œBV ªOÔ`öÀDè %%8ŒPˆBŒ¤dã¥f1! %	>@u5€²rY×†xåå Ğ`QI€s.éTÂ%+7ÿ ¤÷¬jĞ¡Y(Ì@"I¬ÁSí€R”¦²8EH|” t â	6¡
%sûÂ™.
Úcå ^©pô¬ÉDó€$I~,0Î(bfaO¢D@L “p¤ÕıGŒQÌP(ZàÈuŠ‡I* „ ü5éÔk™Ê Yõ3qR«œå\à‡,æ¼H€tD„å ³ñÃ¤ 	Ê³OÊ
'W	 QÒ¢$úAB:@!<fj0€`é(Šßzg äı°	@¾çp…T4Qì€bBˆq8¬‰„Ã¤ 3F OR¶`Ñ:À$ Ë< RBLt€`? ‰JÌKß JDË©€XÑ]<V@!Q3×ß *‰cE¬ d+O¾8ª0ŠfJˆ ú‚VI’À R=™À$ZÍÂy0f*q€RpúA$’ƒì>b šÍ¯X e)š@sTÎ…
š×d}3  'CI@ JxIPO©«©:D¥9œó€}Nc ¨*:å ¤á:c8!J¦P	8A¦3é ¤T'ŸŒ† g÷Õ`±€‰4&fFÖ0€
šMµ÷˜¡&•˜J)€ı!?¤@ªaIKˆRŠ€ŠÆÑª šy˜.xJËÈã—„JôŸŒU
|:°8 Ì{¿8Vu N-qè€{‰1Aöéç4šL“ ’–P…\(V(mš…>?Œ3¤PL|U€	$&S‚Ê¯·Ç¤ ¨*}‰Õe)Eò§”¤gNr€1OoXFË8¥¬ü £¢!á11Ic zû¥ UPªÌÀ	!€r¯¶"	MN9ˆ®9æ:À(¦
¥e*¶Š¬ª1ñ€@(S) $´àpÄÀÈªÀ)H'Q<ú@¨=ÿ jÀ Óã [,– $ ˜{k ˆCLjÀ0Q+åøÀ¸M3X:}¥ÖÌ!ÀÈ/á ‘+Ğ¦x!€Y‰JŠ*xá  Õø$ P©Ã¤Ä5 /EûR…Àj
‡1ç Ú’	HSá  €õ7 5”Ç²&~@"$¦f’&pL`"Š$réã ä¾ªÂ*Ñg†0Ğæ0Šà¾ßé˜ñÊu3êPª
xÿ ¬ÕA¦X(94N°RÃô€’ä=˜$aAD	"kÖ*Ík†3ÂAe¨O!A §¦eÂ Ê¤}© Tœğç Ã€”ú RÎI‘™Ë8 ¡(
„€”©úhF	„àB°«COL‡„ ³P+X¡ƒ1‰4ZÈ Ÿ²p–(på úŠŠœ 2"û¢€)P…1BÏÙÖ©Oµ' É!BÊ‹X Åf‚j’?o8 UÏõ€L¼  $WÄ#à§¤ s¹ª *Óé„qQáQù@ ‘4I•Æº¸)€$ E%j ©>G(5§X å^°I3ªu€RSEY§â Ô•‰À$jSÀ¬E©¦?” ³QzÀ0dfã ²?t Gõ€’)CáÒ +ê%z@#€÷}’™K0¢™Ì„\  ”Zd'_ÕŒ*+‚ãY@½r¤òL„%¦“ûÔ@"PjÇ1D€DZâ¿” ˜”ÕS?´ 	ã†?”Êu5€Di@qÇ§X  @!X§ E:@ 
”À4ª*Hù@)Ô¹}²€‰R+ L¤:À"Ug.‘D¬dĞ&¿”jÉ0Æ°) PUŒ(¡ÔU+ äk‚Oç R²šye ÈP}„ ( *¸œOœ õK ÆšÓØ¢Jå 
Hë ˆÄæ% ¤š€ö”DÊkà°q¬¨e &g8ë"OŠq9e H‚0®UŠÃå PÓâ=s€c!Œ 0ãšµ{s}¶œÑµÛ;å½ôW¢¸—4¬y¾®oÁßÃ«÷?Ô"Çbï	³¹Ì½ÅÚ~EÆíšm°Íá÷Ziı)X¶ùtìºÉ—õ·Šıõ7’·¾íşéá›k\ËsayÎ(ÍÕ·:Ğ{òÃ”s³}zÆä×n¹ÇrCzÏ—vÑÛnØ«D¨A‹N1ß“ËñyöÓò€îªˆêÁ‚ITQ„Q*”TI¦0B¥j+ 
© KDÊp@t( Cçä°Y©­ OJƒ˜XQ*À… gJÀ:ø	(€ˆT%PŠQDÃÇ(J¢P%~â ¿©	D@5ı+:°¸Œq€<D„ó€'€\¼à &”Ê šä:U+'5®]VT…dƒÆ£WÄøŒà ¥`q5ÌÀyœÖ !éÁ 	)@B@4”ÂÀ1‘P˜¬ˆ"²J~F.¬ ”©öX™ ¬ºÀ2P&#H$é+Bá `”¨X™Ï1X¢TÊW¥%Œ CŠê–”DJt'P0 	}†ƒ¤4YÏ$H’Á 
¤„˜”T ®XÆ4ÿ Èj?8ä}$a æ&+Ÿß )] ÌÎy T˜ –‰
à ‘ª~Ä@ø¨j~è5 4'í(2'‡Ä0¤oŠãá ‹•U”™+úOµzÀ* Å:@5_R(HB¡^ƒíX&Ş¦efb–g!ŠV(€Ÿ„IÄ AÎ8÷Xù»ş+|àÍ¿*]òo8£IºÃl‡>v·í½\ç‘í†æç¾aµfãmÖ]évğ–ÿ À@ô¤zupa÷ÇiÉ²ı®FÓ7;[Íùwì½ª×°È°®~èÚ7¥}Í½ı÷„Ü^véÜÛ,ã7W	ußÚ^isl¼™Ÿ–ZCqÓwı71Ó^³èÇüÖ¶ã>€@Š)És2óY„æZŸŒT ¿ŒQE3‚uaø@!!P‚}`$ UÒ3LÀ	Ò­g:N k‚ığZ*Ÿ%ª‚¾t€ U	ZN ¨)$Àô€&„ÔÀséÖ#$ü $€¨ré °UğJJ¢äs\¼`QS*y@ /ˆ0P3:@+04ëı`3)H ÿ µË¨ÆsèRU€ èƒ!Hêsğğ€r Yƒï€ CàÉ Âeãø@ Á÷c %d½ã äÊı±€jœ &¤ÌËÆHÿ Éí€‚™¯ô€J¨¥¾@Šˆ0ñ€Z—ÆaÕ'‡„ 
|²*`¥P$Ìq5= 0±
Z²¤ ËÆEd`$È/–p˜T–Gó9ÒÏ8‚USN‘• *Ğ7 ÌÔ";f ç À-*$Û¬iÕ#Yà (¤@Jˆ•÷ ¥!‡İ( åŒ`L”¡ë@J¹5_¤L{V™À*% €k%+¨Hˆ¤¡L`
W,N0!2!N0
B†GÛí€$ŒÖc1eËn:ûõ<|°r/ÇÙŞãWMdµÅûŸ˜µÇí7t]û…s‚Û?îh(©TöG†L×ª5rò|®ÚÎÛ›ãîşŞ¶Ç~×šãŞ-ò{{X[Öjû.Ê5¶Ş7Ù|#=Çv¿lsz-Xæ9«.#]ks³¾Àäø]&“œnr9]]/ˆú}Âö¾Õ›}“.¹·œ/_}âıÍÀ=/z € h ï­õbVãecÇIÁ³9f&mÍLIT¯„i@¿ŒPPä1ğ€HÏÅN0A<Ğû ëÛİNT
a!ˆëœóğ˜ş°PX”OÊ¹+÷``B¢…µ=  >&ƒ¨ª*Î 	Ë5\`9KP”H LÌ–9sÁ	8À9É:’4 ÅÀÓ( Lœ§øÀ ‘3\àIEUN^PZ-f ”õWÛ ädG§t)Ğ ™Mg:b`©ÅÃÊG8$‚k• $'Œ°0 DD?”R
ã %%‘ñ€U‘‘ÿ X ƒá ŠŠc ¨?ëá ŒªRj‡ñ€‰Jº…`«ê˜˜2 EÎ •		œ„ğ÷, @œ«Pi ˆC©z-` "’€]c1_(›r™@SZ GHÊ™5 KôÀHâ¡TÂà¤Á
ŒÍA•(U|¥ÈÄº‰)ÁT¥ÔÀÓ)
ÁaSŠÓÊ
j“®G0Hx &°[©B’ÃÇ&ñJApe<Ğg
?9@ÂEq­<’P)
™©)öX!ê§–0jF·İ;­MfÅ›¸ÿ ùÌš”yùvôuÒz¼ÛõW¸¬Ø²İ’†—Ü$¨˜TCE#(Ï¹®»\9WfÛä]Ì;‘Øn÷;A¶¯]Û½ÖÍÓPÄ?TãÑÉ&1\ô½rôÇÓíÿ x]Û3sËoY~év«2Å³q¶óqdÇÉ/FíË³ñîŞ]°ÍÇ!xİ¼ôsZ­c| ¬zõÏzóm}­Ì	{ed,ªCE@IxÅ¡õ)êˆS(¡€Z	©ëH¨…Óã$M ™J¦=`"z•ŠJõ‚™:t ¦0DIA<p9À<+çö¤ dP%€Ò("¹Wß( @<„2Ip€mA¥F€kíöˆ§:…¡şãÖNFµ"I 4cC}%fÀH€œ‚Àkÿ Å„Š"yÀtú×ı`ZĞd  ªƒÁz‘ º„À0L™Ñ7ĞbpQYâ§ı`$Q	 ")+ˆÊ(8ÍGã ¤*(POí8HD Î'ÔfD½ ˜VxTÀ"B"¥T@tç9€0"å5HàP”U€DÈ	s€K54jeŒYŠ~¨  *UEOİ ‘©J˜‚%N	AÖ:J"¤ªŠ2übª§YA©Qj”+ÔOl)*û ´‰˜”
SRŸ
O¬4B@’¥`ÖLs¬$†D!Ê ÓTä``äJÓ
À5C’`qöÁ)	àªV_„xHÜ„à`)¨*à'áÒ
AtñªAAPJ˜·YbÛï\•›cSü éÜ+šw"ŒÜno¼µI¸÷‰£H*˜HGƒnµè‘ãNıîws]Ãy–iìlõ[ùm!AÅ®j.±ô8´ñ<›fáµöw¹´ÍŸò^ıîğÛÜ]e§5×c¤"ü^èÆ×5u¸Zv·µgq¤›-oÎu¡¥„à0ZLÕ·ä:h²C3E 5,U@LÍpò‹ŒÑLV€(=³ˆ¦`†˜Ef@® uÆ +$˜ª@X±A!#\ürˆ(Pú‡·¬P(
0¢º èpı#( U ‰`E ¨ ş&
x„"+â“¥BP?fà¿øh€G™Ê /¨¡ÄX¥B© §â<¬º$Ì“T’?Mğ€Ê€„ÔâR êëZøÀ
IJ	”É~ø¹á~pÒf”"¯±' (šÓî€t=W	‹YÒ ¡¤à„ªS€@Pÿ ÄeH$ÕÇ:@$šJgUÔÀPHVã |3®0¡ê`2Á)8 ’•B*z@,Nª²€%* "	h—ç2 "JQ~ÆuEq¢c@ fqı8ÆT)
N@Q`%é˜T` Ù-
¬é €ô’˜û ÒZ‚†F
S‘>ß¾´šxu0lŠ¬¿Õ ‰äq€ÎSJËì° BRa=ª`˜Ÿ³ğ0 .©%!¥
ç%‡,ó¬'<k Á2é,k…î]àÛlFÜ;I¼UÎÉ4Îf8òíÓé:¼÷õ‡ºÏÂşÏnòİÎöšJúşÑ‰.HåÅ¯•uÚâ<×Áñìå¹ñuÍÔïÜïnnÜÉL5ü£ßµÄyõ×5éO¤Ü½~÷;¸qï.c‚i šijño}¤zG‹Ù–ÆÛ?ºÿ UÀ³úLG»¯ª£Ò* ĞŠuƒ!T¢!ü ¨$&G¡É ™§ZÀ5B¸Ô  Ò5„¿8 	ÄÏ¤RUp@	TB‡8NHOX¾R†¹O>‘@åU€TPš$ 4®8AI>ß”$“YÕ„Jª D b'Ğ~1 JLûbTÈ)Òkã T&+ÖPH¢¾ Q98¤ Q^4€	—Hf„Ï*$à	5¿ª‹5¤ A ˜Î6XÌÀ5	( ‰–å4Æ^§¸xu€Rf˜ˆ J~Hs€$Lç€4ša€À¬SÂj $di PI[—H )Bé.0	3ü 
Õ:ş‹‘à #$R¨*hFP„—\à‘ Ç3ù@%EU=êLªsŠ¨S:J^È‚›’F£Zc«•WH²˜ˆsÎ)—ŒĞN¢²A„=f>îQêöâ`¤WÛP'.°a#¦úËóˆÙ)(
‚d¨Ps–“¯´,º@$€gğ€(\£‚@ûèkXQ9¯éYÀ%P c5”%*ğBH"¥U9î¾DŞ»vèr[3Óm´>Çƒ}³]õ˜xÿ ê§qœçïÚkĞábËuğªá2¤G¯‹_ÎåÚ|&6Ö-mC_¾å÷-cˆf¢Íµ² i2F¹Øà"ï¶oàºÌG±»·¶û¾ÛfÆ³nÀëÇ2+>®Æ8ë<®YÚº“:$È5œz\Á:SM1œÂÁ)¤¦z&–—$Ñ'Òjk…GH, …1+ä †
gY&x@/q£4€“äc—»Î¨—Œ&]2€D¢¸áTË)		´á”PÕ«pÍJÎ¤À4Qé*§˜ëJÀF¥:ÓÆ’‚ÊxÀ	ìğ€@š’`5¡Ä~Q@Šã‚¤+<BùÀ)TáX!Ğ AQŸŒ3 g ÈA= 8¬ê[Œ±€N‰ı½ÿ ¸ ¦Bp	Jiı!82ÒA( …[3? ~ª¬’Y@ ‘Oy€HRòñ¬ Y`0€,¦&¦ˆ$2(iNMáí€S	^‰X=+„Á) u!şPÉr8Šªş0€\ŒŠPâ3= (”¥öœ k™ûÇİ €+*áøÀ˜K,×ßER•š•Ñ ¹IWÂ	[<:QI€r( ¢,¤ Dæ*¾éB†¡H]?œ@ˆ"iZHd:ªæ¢ J™œgÖ2€H¢N§ÔPfÑd	Æ  „¨û ¼“8¾	°¢Ñ?Û”P–iQ2ŸÖ2OQN™ÀXó;Á³ãßêK·ÇÊbW©9rÜjºÌ×Ÿş«wPá8+¯kôßÜÿ a…¦ljzûãÉÅ¥ÛgªíˆòæÊËû¿h¶ç‘ràeÂ	k-Ì™Œ#èÙã}o›Ñ¿K8C¸ßİäÀí¦Í6ÛOÒ€„©I“Ö<›WZôÇ´ı¦Áš×tËô‚zí¤Äp·5QR¹GD3¤ĞË!™‰š
õ‚‚B¡
Aœ â‡5‚`×*“_&	VU3ŸH2«\p‚a Pe9‚2ƒVQf|:Á‘4¬| 	c%’OÆ¨p«€‘JãÉIJ =ğC4Å2Æª¤”©ÄÎ

¨ ƒš~@Ò=”€)‚Ÿ¼Å(¤c JjgIÀM'	øxD ¨ûñX¡”®8@˜JJ*©R}éœ—Y' jIP+ —"§(5Y”¯á “¬Æ0Áœ²ˆgI¦=ÿ rø(¢c(²è=‹ M‡ôÎ† )æ2€n÷š€ˆP€ •@€ŒèEh° |XV"~šæ¸@FJ“€&²s—H=#¥gÎ ^’JO( Ï5òë –IúA Å`Hû )ÔJxÿ ¤$q?¦s÷@Q8)E‘HæÙ…+*ID¼T@
‡2Ù¯OJõ
ˆqŠÆ“¡÷Ä R=8…€su8 	‚a( ™  ß…	ÁJÀ 7ığ’¿ùLé<½°ª**Ó?(eÏÒ=Õ**P²Ê )…Á*¸A/f•İœ€}÷Ya%–?¶nıDfR<\Ûæ»é®#È_Z;«ü—5wÙŞ'nïÛ°«YÖP/İşß\LœÍo³xÛ»N?q}…Îä·of×i¤zÚ/„Iœã¯&Ù¬ñëˆõ÷Ó^ØnÃc²ã ôX`våÆ…Õy^¦Qä×õìŞılÉrÀVyG±ÀÄÉÓ¬!å†]`‰Ÿ³Î	Ğğ
šİ4B‚‡é¬ä$ …0NªĞ¬à©A2åøÁB‚Ğ(ÎŸP1ñ0XJ§ê”òñƒòÔÑR©("L”àBà•%RŸ«.™A!àF~È.õP Aœ«ı †$A4Ë< $ˆ²SåX¢¹NF š”*¦²DZ¡€ª¬©Ğt‚à)JçRCD3–E&1A4Ÿ°t€ˆ™ˆ’Â	jA#ø˜¨°R¸*À/Mé¨ÈÀ1"1ë *SÀÀ)ÂRöÀ}B V .LgÙÀTÊiÑ 	ô$ÑÇ¬™Y qQPz@<Dë<é ’ET`¨¸&Pâ} @9/L ¤ıÃ€FK,ÁO´  «‰” V²ÒªFp.A)Ê $¦“’å( :s%Fy N•i®	Ö`”&‡¤ SQ+ç„à-äMdiÔõm‰Y“# ü”dO4šgÖ¤§ &¯R‰B?((<ŒÄà†Db®g qJH¦4€rø‰ñ_º@"àj]>Oô€‰~,eA 9ÔW¥Z!øEÛıĞØìïîœ&Ğÿ œ„lc}ñ-kY›‡ï®å»Áğœ‡*©y¶Í½«Jo]*ORcçë<¶ÃÕÚ¼yÈëæùEÕ¸ê#áZ…­s©?LrÚf»gÒNüùœ†êÁe¾=¡ÚÖåà±ZÁ¨øÇ—›lL:Ç®;gb6œ}»š ½¸  ÿ cG¦7Å®#Ï½êÌ† ï1Û,$«6™û ×íŒPÕ3–F`¹RPSRªˆR•~ßµ ¡TÌN¢ ‰Èœ`Pé”¥ 5÷@9'âpœ œ±Â	ÍiñË:R*IğA,©†>0
z’AB’gãi¬¼¨qB!dQsñ€`,çşÕ5"‹20 XhƒğÂ
	AJ”¤?3 +rUÆ(T•¡Â ˜ÂTŠ‡9&T‚9*¤ÒS â‹ I
H@!3Ò‰IÀ
„Î Yêø¦™Ê€”I	ˆšxˆ€§ï8)é$œğ¦gÙ ¾ÉÀ"UPÊ¦ Ê\1(˜J,ÊÈe ªCª“H†A e+‡„E(”4€DñHb`¤ &C?	ñn“€B€;É(½ #‘Ìâ`J˜M"AgùG6Í¥OA‰¤	š‘<‡X¡¸“ ÕÊ€&`À>ª'S!îˆõN(cH2ñC‡¶  ši* †€ IÑe	CIu¤ ©ˆ‘ˆ‡€Ã5Š$¤¡1ö0Q,‡á L§÷ùÀj}åÉ2ĞfÏPo®ïüÎÈòsíèôqkêò×>íİÛàí»æ»Cï„UºñDµ¨§¬_·ÓÕ­ö‘Ëûsj÷nE·ÚWúm\k¤¾ëŠ½ ¶¨ ôoR=qô³¶ŸnÆßjmµŒ»ıÍÓÃfBãîHócËf¶²L»œ›ğ„h À!·‘&ÌD’@×Æ @¤“\MW¤\¨	"ŠŸ|Šæé0KgD,`$•ªÕ:@ I@@ }İ 
k]&3g$€u%eœ pR“Dè  J¢ø  ©?PÎÈƒ%9t€‡2Gå"\	 +j`¦Pc1ˆ€¥IöbJfrı³‚v@V	“B‰<€$%ˆ‘€jŠZde&¡©œ`IDğ‚á%ŒL”¦SA<¢Ç*¯X`+f0ø !öÓğ€&ByŒ¼â¡Ôf%*@F• ’å B¸À£Áß¥ %5v™¬t€RTh¨³€y”LI€ˆ!ÈıŒ2$ªÈÈ.pÒ¾_œª“UCã”  PYÌSİ ~¯Š³€]}şp SAE–EÎ© ”P€ªŸ„à¥uR‹á ÍO3 ¤‡õd„dZ¸b°ÑÒ~¡À…IÏæÙƒ$*< Š1E2û,@‘U&îŠ<‰œ±'8
™Ö¥sˆLÕk À­AIã€¥i 
i3%PN $'„–©œ@4?Â…pB~ _Ò^pş{œã{s‰ßs¼Îá›>3³wu»Üİ]¬Ùa}Ç¹&P
	’ƒÆÛb7®¹y×µ¿š=¡İİíÇvÛ\½áËî™±ã·îs­÷¥ï°×ëe´‰ÔK[3n>]g•ÆmÇµÄÎ[ßxsLÚ3}Èîˆ}»÷®8©iA1ùGÎÚİ¯âöëˆñ–şö÷º»—uwqp´0ÜŞn7/Gih›Y’šú_&‘ç™ßg@úYÂ[¹YmöÈØZùÍ¶.kIÒÂHÄ“8ór^Ÿ‹¼Îí0lxÿ Üéæà·JÓn^&:qkˆòò^­|ññÕÌOÄI)$œPÂ4 üÄU1›OX (™
ƒ‚†_))ëì€
ùƒ /C” œê5¢Ä&½"ä
Lóü!‘)IB¸øô†B!Ô~B,’TêNY¤%TQÄŒ‘GŒ3ôÒ@)Ë	p˜Fœ¤bˆÏITQ%>È"S5(dQ `Æ¥"dŠyÀ‘ˆIŒ`¸IfÑ.LE	ˆë‚À"O”„ÜJi*J$äq˜©b€¸’•÷¢D‰>ä1C“H|bƒTOğH¡*sÇıb…†©ßoX S¤JXõ€@‚‚¹•€k‚¡YD5iªJ 2$bpñÎüApÉ?¦d? UfĞÀ&øHá÷@Zr{û\o}¥Ö¬7Sš
¥ _ÎûxÌµ®¹¸W±sçØ³yÍs>sp°¢·X˜\Ä³0¦f`HfR*ÒYtÎ¨´~	t¹]ær€iYV©Œ'ª ”Êí€à3z@"d¦‚YÀ³
€d=ÂÏ_²§æè`…E3œò¤É,*:@
Š¦=k 	„4Î¦“%Zá zQhià` UH‘#	À4ÀK$ûç”©m¡éç Õ
9Ö“ˆ  €²@:ÌŠĞ$ ÚÑ–‘s¬;Î'ü%Î/œ²íï¿Únv|ÆÁ®Üí®ğ|²Zú1á51Îp~M¬ÚaÛMs+ÍÇÿ ¢».ÍïW¿móV9îgaüwkîYmö7ŒÜnĞ^;»¶¯[³éæj×GO¸û-|q†8ø|n[ÖŞènÏŒ%›ºw;­w/[æ2€.g8ópë›—£kˆáFíüwjõæƒ½ß¼ŞsIAonÇi¡ÕYÇ¯~·Ìñt×>î§üvä,r_Pmñ!á§›±y¶à-(Ùÿ vã¦~ĞgO8ãÉÇn>Öm$¯p2Û,±¶m·M»@1­DM2¤wxŒüICSœ*ÊDà0 _ ¢“Š™iI×¹RP£EûÌD0º¦iTÏ(¬ÆI9å¨©_vPŠ,ıİ  ¸ÿ Y@2à“>ş± IÏ®İ —‘T="P…‘ÂGÏÊ iÕ!‰€J@¢ä:ÀHA‘8ç(¨(dJiTûcPIj‘êLXMqº±û	(!APfE<Œ ¦¢¢C(¡ŠLLaQöŒE~Ó€‰	ùşJdÎGá¯œ\PŠƒH$0¡z@1@(•šâL NœŒéÔÀ0}J†¨DPÀÄƒLB
‰Gİ<ôùE•ÅPcK!Uû,QU]%‘€>¾ *™)‡œ …L¤QA—œY¢×< "í@=Íæ!Ò	Ep€X<wgÔ¿«{mÅŞ*÷dÿ ‘ÚÚ¸ßŸslâ×1àü:5+‹DÜ€„œy-òéµÃÙ®šÎ±Ø{3»[ÜÛ1o}¶ÏÚ¶Û».à!ÂÙA¨!Àá¸ù<º^î<œ~=}2šš*K\BÌ-“úÀ2K}D{2X=3’Êx Õ´%A¦PUOê€= H*U>øIYHıÙ@"A$eH=#$<Òf“–ÉĞj*š¦j’Š$¤€$Z©ˆ¢ïÒ1ó#	’!Ö©Ö
cD éœ>#®ŠŒ°?š@4p„S%ˆ$©©€S	÷¤¨ŠLU>ùÀ
Ô.ºà*çzS¬3…yßêÇu››îk]wçŸ“·´¨¸ÓkPª™'XñüÛeëãŒÇÆm»C¶¸î	¡¶îlíºîñ¥Û»ÿ Ü¼åèNŸ(å½ÍÊëÖ¼çßÖ8şääv¯7ÍÎà¹uüVĞ4\e®#ctÚ·¹¼À—û—µÿ ,[p@5#„zu·MzLãı±‰µëXîW³;‡™ÚîÄòQä¬6Ïµuã£ijÙ$‘ò‹u™Bc:rk,Ì®»klèĞ;Çµ;ç9Û]¼7íä9‡qÎãv\Z7;n7jÇß?=ûw–êº·n=®yyhW$„}õºÛ_òñòk|¤ËŞŸÆŞwæşğ#–İï!°¶íƒ÷y¸o3lí6î’Kµ[,™ó6¿5o:GYiDÄbFÜIVç3Òd „E…4DÅHé ÿ æ
ŞŸŒI©N°U¤Æyã É j49Ä.¡I*Q )’d£€5N2)ÒHP&U:¦qA%©?º UR Ã(¨†KŒšh”ü` g2¿ğ‰@$tJÅÏÒjÆ¬ÿ áá Ì'–(”ŠÕYû±€rIIEÅS {<i¡(™#P!1ÎPSYHÊ(eq¹4€I0¾F”ÎØ‘5_°0$e‘~pB9f’œ”
™ƒS LS#Wc) [IÌ@55_#„T ¢‚%N‘ª+?~QPË”çÖ@NLµP&~M$ˆ` …Ò¡É4”P•õ8‚År™+\ÊÍ‹»şZÓŞÒ]¼¼ëˆj|½ØGÍÇ•ü^ÎÑÒ÷!çxÖÚşİ’ûî-õ4£uPLÌÇ¶Û/OgŸ¼BÕöÜjòîI|#Zï+7\*ôÓ:ÏÛ Šı Š%:(éÒ!8Â  €@™$HÀ€HÃ~pÁik ‚„&§†HÉ ,©<R±ÉĞ#Q¡Q0Î MD Š¸˜a2Äø@pÄÊ˜À2äêÆ‰ õ®3PVS+CøÁŒz¬êjdrC (‚¨Ië VF´8××e„Èÿ H#Aú‹Üÿ âÛcnÛî=âÛî04²óÜÓqQ:FK^{×W¹™r–Ğîû¦Ïpòıl,[[ó7±pÌü{c³¶1ÑiõO¹ÀoŞ[¹ºÃeN«—¥ø•†šymíÃŒva÷_Õ@{›}¶éüI±ÃlÍËæÅûÌÚYşÛh‡2Û\5i35^ûM:{¹kúºû:Wf}ßvÓnóíî{–ÚYŞ÷n×uköášg¿ãojyqs´\:Ce#ÍËÉµÛxôÄ³.mÌö–Ë±oğÅôèïvÇaÆnmİÜò¶ìÎáœÃnîå¬a-a¸æ1 úZ‰êXí¯7•²ûÿ ¦6ãÆ+Ñ¿Äı“¸o¦nØîšyöØÀ †Z	?„.pó—{}ØÛ^‘ŞŒÊô¢$vq
Ñ"k2<1é6ÔûÍ)9&3CÇÂ8Šº”HRkA%¤àZ†59D”`üàâ³Äá_“@@Ë()
¾ÓœPÖ]0#îˆ	ÇHh²©L¢†	§êJ˜€
B€B¢ eŞ¢$c @øŒ–‹ å% šJ `€r"™EÒÔ”Â¡O†¸ô€%HwÄ}é&Š	 Ï¯ç5A"A* á
F  +:c8@œ•J.PPéÌxA)™²ê´ƒ!P}ë?d ®œŒæ(°DU§„†¾H¡PÖ´IÏ"°©T‘Æ* J”§_û–í[7nÆ4)¸âfãºá‚ŞwVÎÀ#hÃ¸!}gÒÉe‰>ÜÓÑ×^?v½¸î[t\ÖîÜ~–ZµÌÌÇŸn]¯«¤ÒE¯î·ƒıË×œLËÜ÷KÆrÜBà¸Éjz	!U=°RÛºı§5à–İ]M{	Q’&"3kšŞ¸:İûÎºX]­ÓVÉ³eò¬â3;nVÕÛl·¹b€ÖÛcÕN+á&şìXÈ6û¬…avâÂ ®`T~QÖmgÆ9İr»cÙu¡öÈ}·„iAóÒç³˜4˜2LsŠ„Ÿé”.ë‚}¥ 
1¨€HhLé!(B¥0ş°Î@’)’ÀcTŒF'Úc“¡á¤e>°nU(½P‰(IÔ¬º@	CR=°Bı¤ĞÈ€’Šš¿V] &+\V¢`‘ğûRpSÔVXT	‰A	Äæ‰€ÀÂ$¤Ôåöüà¸+×mÚ¶û÷œ-Ø¶Óqïq@Ö4)'
@ÃŠıGî›[ı·îì^hSsomÌn¦HúØEHŞï^½uñrŸ¤¼>çi¹îÒuÅoÛw-İy6.\²ınuŠ½®j£‚ûã[ŞË³Bú½Ü»îIìã^ÇnmÙ¿wd‚\ã/™q›JIf	Xõğë¯?%ÊóèÏûÍ¸»Ér·´ùÃq´³osò®[Ü–†|Ûhæ¼\xHçÏÉ‹Ò7Ã:W y¿£[î[³ø.×ßsÛ‹»Ş3“Ü÷5¾Kyvîòıû¯xº,nt9ÿ kQÆïg§»RJá}çÙ¹µîmÏù>Zí­¾o³å¶VØÛ·Å–·szû pÒçèhz,okÉy#»ı
íş/yÂşóm¹İ§Ëîw\u»wœÆİ·¸{şKwH?º>HcœÕ­cZë²ç¶ÖL;š•3@s¯º;¸á%—ªagœà†&5&PRµ9À"%$ÿ ˜{½‘CYŠQN30 8Bùø@3”€‰œ„æIÊ õtÉv^ÈKH
d1ˆ
%TÏìs‚€V¸ÖA	õg Äò™¡Â
`¨*«•<ÁpšË¦f
`ƒ$Ÿç­SâğÆ ‰RˆŠû"‰3$Œ¢ NS\r'Æ•ZÒ£¡çã8	*( ÂuH (L†Ò
ª&™dF1Dª‹à:t„
@Q	3¢K 
€Ç­`”ˆªÁ¤dŸ_(&(sóò€—¾ ªj)ˆñ€s5’ĞŒP^¤œ+\Ÿ/¶âí·æz÷W6¬êrKQÉ£8ç¾óVõ×-ä¹SpNñå;v›+mâcÅ¶×nïDÖIÑJÖÙ¤ ÜéŠ§ó–•?ibÒk¯HLÊ@Mûv[a{Zê)-2˜Dˆm¶—¹ ;@Ò%Á¥sÎ+J¬uÇ?E¶#?4¹ZÈ~PD­è'Yz(–¦©O¾x@«›l@ió*Ô$ŸRÒxÅe“Úo_oJÇ6¬‰>1¹Y±™Ún÷Î´àÇ8zÚ$.8£JKïúí×1ÎÆÄ¶omMĞ”!$LAê#Ù,±Çcr6@ş‘Š"sPFyõˆ ¡L€÷,œP
rS3X €¨h$ú@bÔãS"f¦¾
D¤Ç	Tó€`@U2€t&h‚f}4” 	*iì€G<ªß(Šûà JWí””´J¦g)@GP'ö”Ÿ-wmk‹ŞëCö¦ËÛq¦aÁí-D=Lg{‰W^ïı@å9¾?ufÇµÛÜ³óo~âñ´.ß¸KXCÏ¥]¨&j#Ë¦±ëÚºOkmÀö…›;¶›\•›/·¹
İbåÇk**$qW­[^çmn»Ã¼÷¯kM­¯ÌkY¸Û qqâæ9Z¤â#Û7ñÕçº[^‰ìŸ¡ü/²g%ºm–ïÍ·;isö¶EàğÃ¥ïqƒ«Ô‚i¼.ımfmãÑĞ?y§iÃ»pË»Ë¬wîØ²çZÖm´<Ì€Ğ\	eméµŞhú·Ú[ë<×2í¶ÏqvÎ÷ríÍİ»7K]nëXK` !c¯w«ĞŸGûouÚƒÇl7Í6ùÛ¿ÜZ!e—“äÛp¨-¶õ&=Ì<»\Öô\O\<£L¦J-W!Ö@¨!@˜& 4J`AœJej|üâ†LæPOÕÓ€‘3˜€^“:…‘= ’9à’BYÍ:šÀ)” ÓÍ")‘ä3€ŒŠbfDà´®ˆ$e3‚f` LtIù@<
” øÅBTÂ`OÀş0$ÈbÜE' ”„O‹—ß Ír"¹Ï8*ê`q€?Jõ¡€cÒjcÖ Hi$\rÎ(”Á"†I”@‡¨È™KÀxÅÔá)æ:Ã!‚@”úÆ4¦B€jà N¤tŒº'² SêhR(°e-NqÃQÄ}Ğ;€âqJÀÀ'Ò•ÏÎ*-9NRß³våãUÒtØ³ş÷åá‰Œo¿ŒËZëšç½öòıÛ»›ï×¸ºïQ>· hĞ( Ëğ[µé‘JßÏ®?æ9s´™diymm·4ºë›ªnrÅÁc"¨ÚXÒÖ‡ÿ ¸¸’âh#FS;M»€…¸ú\áøÄÀí,µ¾¥Ô>û¦²”UÊ³šån†¼hQl€}, 0iÔÇéPàˆ¢F ¹kàXÿ ˜âínôÜF”:iì…V¹pœ€"ˆƒ#ì‹²›+ˆC5)áâ±ÒV+5gtûz®}´å±úšßÔ?âñõß{k•Òê%áõšQ#»øTŸ0k%3¡4"T0ˆ8‰À-$«ŒÁ‘0›Pô"IP‰ÓóN„¨Ş°]@\gùÀ_H ÔpP
¨ÀÁ°
’qÂEÕ5© ıĞX5.iC€S2d®Èiš/8®€Ÿ¨’©Ö&Bü?¦‚&E¶ÿ ggÙn6[€ácrÃnë˜šÀ4sI¡p³0—.¹úUÜ.\^ä·-çwö;·™ÉÙ/°éÉÈ\‰1æß[æò´Şïîğ›;¶÷·®_å·´òV­ÛBÍÅ°—.5®*ÖÈ$«µ]™®ÑŞöojğ.àæ9}®ÑÛ½«y+{MÉù7îmnLÂ®/y£Dğm›z#xç¾¸öÏİ¾Ï–İ¥Îİ×>vÙ§qwäf°Ôjˆ˜Å›o´Äsºk/T÷=óÛ÷oî7½‡Ü'ºöü5Î6öàÙ¶ë¶¶ûmÍß“zİ–²Û5¿O÷=Nf1Yu’G~u»~®ÿ ¾:6öóÜ5æ[µµæ6W¨ü«v÷»rã¤¡.`ˆAŒæ3ã}›öàãx6òß$¾ÖÊÆãs{å–ú… 7…hšŒ„w»I¬¿‹–º]¶ñ÷ÃÚÆ;ÃµxÎêÚlßkeÉíÙ¸6Øá{ä9Î-sæÌés\5 ˜Çm7»LáN?®¹ìÎ9ä __durII
*”¤TE@iÒàÕÆ`ÈÀ6ƒ"†sJ•€^ 	yg"CA¢Iˆé “"®3‚‚¤%R‰–0Q°‰A	`N‡ÀA@D**2Š ˜œ pÀâ`2S!÷@AQ3Q’Át” §A 
Â©ó‚œŒÔ&‚t‚/<R(?3ğ€C5™˜€t2©÷¬@‰‘$OQ:p•+ MÛ÷@%r!ö@0C€J# ÕNd‰É`¥,B·ßKÒH\IÀçR
)ì>f˜#„PÅLš‚(€D2– + ‚EóŸäÛÈï®\Õ…··µ4@T¸†çöò¯N³·eäj€r…/)ê='HäÚı–·­hùaÎ$ŸKŒ€X¢£mß	
	)¨Û‘8‘:DD^ç‚IªÛ˜F4#©Îaõ$
‡4øW¢5îİ}·µÆŞ®Œ&n¦Pqï :ÑJjPä'Âlh£î|·	’C›3ÿ 0H4¼¶ĞÖ(õ´SÂ“Ïxj÷9¶Ûª`)?aŒÖkØ›€/¨9ºÜi¦i\ã®ºåÎÖ@í¯Zr4+‡©¡UÄÓßŒe=³‹^m ©fcßÄGM/£;OUÊ8•IJqÕÍ R¬œ' „”•8y@ƒ:¢g‹j ‰×ªçõ,¥\i Š|GRŠOÆ¡'J”+IPhDÓøV ÕÕY», £PÕEI2‚¤A)Ì™ÄCš¢ ÷Ã*ˆ
Q¦YÍe€ˆ‚´˜Åq0Tf“ªJ@rÏ©\…ë\àÚŞmÛ[;<pı«‰Kwîßº]wåÏâcZIÂ˜ÇŸ—»ÑÇ:eÊ»c¶·=ıõÏä/ç´·¯–eæé¸æÛAmæZ^djºV±'Hé{2ŸWû¶ùİ×Ü;Ëm÷Îã¸=—-Úµ¹m‹OÜ_~âıÖŸ•·°Ûkqù1Œé½’ã²cİÏû´vSûKwõœà¶W,ìÈãvƒ÷—6÷­~Ñÿ 1ºn½-Ş´ğg@Ósté+;cn¸êõæÎå§\á·¼]¶íöÏÚZ;{;vL¶ÒÁ&5€„”£…½eOK7ÿ ‘¸á>·÷“6›!oe¹ÜZäì¹€Zh…±t…ôë«öüšı9+ËË¦ŞY‰ı.fÿ “ŞvæÓuÈo?íwòlØó¿±ä·;wÜ®†~İÂÕÄn»dG±]uë‰3ø;ñò\LÚúÛ½©ÂöÏ·íÎ_â8¾vû66»ÅëmÂíW;[ïˆãçën[Úå¸“ê%ŒJ´kÎfBŠÚœà ¥¤	œòXÒ|Ö`eSXxx@)&*Gšç •d³€WD¯ç„‡1YŠ	@~¼è•L 'ZĞV°§<Á€Jj>Ø@72¼@"¨Jx``tœ)U0ÏÒ'—R B¤LË
¤á™8§‡Œ JPÊ(	š¥&†‹*"…"	”2©ë (S MI—¶ÈÌˆˆL$e3œ
¤†¨ ç–P¬Š$ÓP)îŠ¦¦© d>ø &s—\ 3 ¢à’‘ŠÎ  ”JùAzí¯q¬xwÛkÿ ÚÓWx¤rå¸é:¹û\Ënnƒªèô2¨œ±Hñ½–Ñ¶Éki—¥*ùa\}Ñxí[eÁ®sÃ)¨9	ÂQ¬2WÙd¼1Înu
F@cåÎëXÁt7KZÒJ)^ÀÅ_»{Ye»mk*ç´ÿ Â#8mw¬íİê¸ÖêiVâA5C\b*æÕÑ¨2Ó4H.V76Ü×1¤—å?ŒŒ%0§º¿iQl9ÆAÓÚ%Eï·~ãåºÙWã¡Ó¢b'Ö3kvÚm¾K ›]¥='SJãœ{5×6ªn¬¹ÌÔÔq  šËßh‘eqšÛ­….5Ó“†„bÃ+«w>m¶]€QşÓˆò1Ú\Ì¹ÙŠhS¢úqŠ„ˆDæ¾èÂîÄô€T’Ñ|| 0èhd¸á>±ÉĞÚ„xP¢	HÀ9¯´}–>œ±¤LÔ¦‹r&]` T¬DÆDXACh*3ÌÄS4ô” øDA¨¢
ËÂ
ŠÎ²ZÔSÛ\¶Æ:åã¢ÓAuÇd}Ñœ~ rÏç½fô9ûº»lÛpsE«báùA£ Öi!1Xòç7/l˜˜mŸJ{c{Û¹¼Û‡uÈs[–³`7î¾ûhÖk˜Ğ
–ËÆÜ±/V+¸x}§ÔNkìÿ ò—x¥7qÃ;”hgÌÚñàºç#¿´\tºŞâí¯Û¶åËW.’ë´]ïé¬íŸ£]‰ßŸHûC²wÖ¹>?¶xûV·{6m®7g¼º.©÷ØÆÜ» ®•jLG«]¬¹yíÅÃ)Ø¶mò=­aü–éü­î+Üqö{]‹vv»{…–-‹-pGµ¿1ÎÔ^õuG“l:ú¬¯öWeó_P{“sİ]«³ç7›k{WpÛîBÓ·A†şÛæ[°µ6İ§9BZZ³‹®÷[bí3%\w7om;Ÿ±66·]»bv;Ëƒ{…m½æ]³sHº~K {í7ûš¦µu!ç¶	$­Şé»vÕÛû{Í·¼½`n·¹oû7çz\š‚ŸŠ3ÌsœÆ¹Èn9¡ÇLÆ¤€r\ãÛ+Î …u ÅHô“é2ŸX ©’x{àÍH¤…÷À/QD¥3X"‚ ø, «<ñ¢xÀ.˜| Ğ*…(p¯X2s%Vx-L rJOÙ8 šUj?( ~ ”R|:ø@=SÀ0NÊ¾è4ËíŒ ”(ªÌ‰…¬„‘	œ—	A>ó„ò€`)GI%SÇ(\@)á `é–f $uKÃî€‰¡™Î½` H$) ‹ıSTË8)‡M¨öøEÈ`”ö)yC Y…‘+*ƒ ‹É¢µø I¹¡óŠËLïÓßºfÚÙFY`sŸ€s§.±åå½]øçF»fÕ‡€ûŸŞyR„€'Yûãƒ£=Ûölö½ ¸!	İk?o~óÉ·e¶`¹fÙ"ëÚŠÂ–êÄb=‘¹·\1VJÿ Ë-×v×Í@K@ì²µ¿´Û>Ãşm†5„–%9bá2×·û Àß@{CXæ³^¥ (§Æ]c7şãn,<¶í¿Y%$ZH†¤bºE•íİæ[7-|Ç9‡S³É±ŠÜO‡æ·Çß7\’{.7N—`
5z2Ö[¹ä®•lü»hâXÒæšE“.vÆİÃØµµk®šg0Z'„ã´˜r½[]‚ÒÑ¤ú‡˜^·£•V iTp¥Æ6‹Íõ¸(
p•cE“œ×]°ò‡Qs œ_	á/xlºó‘”ta'R¬ºù˜‘!™—§(0µC‡LçRô¹Iu  8Ÿ )"Xà`„e5^¾PPÜ’…:¬(Íz‰ -O´ô¤E5:d„ÔœS1@¿35$@"@G
d\€Ì`-÷¶ÆëkzÀwË7XZB…E^‘,ÌYq^jïßïäú¯³ãmñ÷øû<Ö~æõ›Ÿ/ä’¿wÔ»¶¬Ğ¥MXáuÇâôÍ¦Ë¸7mãv¯<k…£Ç5¼o÷™Ü0œOÿ  ¶yá]?³2eÉ;aœw9ß¼÷dØafÿ wÆqV¹{¶ëW­vÛ?»rÈ}K®­».î¤ÌwÖ\|)µÿ C‡;æ†–”`lƒZ( À”®?‡ÙîñâC4Ùİ»oÍìš7†‹¡©“Û8óYÖÇlô•”´ÿ “ŞÕ·8[å¸››`†n½°¾Û³#ÿ ÑŞtIİ¯FÓnåÀA/)‘3Hë—<-÷l×zÃÜI×ªÓ‰ÈÌD½ÖØ—míñèpÇÓ(ë§g;İ\ *x}ñÑñ% ü`Òm¢˜2’VCÊ*TŠt>ÈÇË @>¸@ˆ©'Ô
Ã¬9.K"+H2²TO€?ü)\à‰¬‘ªgCH ”4'§ã µLå”záL •$ƒOºCÓ4”ÌµaTòAÒ
fu5ë %¨ƒ.Í}«ï€‰*AûÒ d©W 
I¦rCá-B¢«Ÿ”œÈ@¤É8ÔÕF"€9S3ú„à&`à€ RŠõ‚˜QÕO¼Æ‘!2¬ 9ÇtîyÍßQÿ -¡³qw‡ß.Kúô+;·1Âãß”>'8	•˜p6ºÈ­ÅóŞo?inûìYv±û"GÂĞ  ˜7M¦ëŒØÙı¶Ñß)û}ê×=î.õdÕUug#•©mùí‡'ví­­çüÛ@í{ Ä ‚˜Eµ"w÷`4½®s.:ŸÕ&UDâepæ;ÿ ¨¼¯½½´Û›>‹mÑqä¡¨w\RQÓ]skÕ{Ä}EÛsÏ¿¶äö[t¶ÏšËön|EßÒä"xÆ7×k×³Ï©İ—e[fÕÛ¯ùWmèÔğåÒHWqŸÜ•¸ğÖ™Ém¯rBÁ<fà·¼æ€×Q3yŸõnédËqãí³oµÛ6Ã‹m[h×¥=Mp˜$ecÑ­èóí×Ën[`ÖƒP L ò–Ä’®v*[lëVÜR4•DªäczDÙ—µoÒ™ùÇ¦G;Q¿l„&z½9á÷DÚ&X­B×#n§æz^
†…l“Í±ÊtÙ¾ú²Rûã»=U	ÂPÔµ%ì¤ ‹@§…øI™JtZ‰GP¨T„Yç! ÁLÄ&uB³R(`«¤:~1%¹ 2t€	LÁ%‡á µD¢,ÆRˆ‡)+É`8:i"),"ƒêÒ†f@xEH@à uÌ"  ©8u€·¹¼ı¸½¸#S66Á´Ê‡nï„¶ Ì6~qË’ºë«Iå¶¶÷¼¶Û…ºKö»poˆ?õ/İÑsxNbv¶½Ÿ0í6mœ_µ±~ÿ ,l3ü¦ü1›Ş‘ófÒ‹LÕ]-R@ë5Äyö¬¨ ‰œÈ"«ŒtaŞ[îù!§uowÇ8™ {ö70Ç-çXé¯jÇònuÛœ(ı—*İÓ€µÈ[~Ùäùè.³®[U·/¤âe„nV}-¿Í´ö=@Y†^q­»KjCoîl
êùŒÿ –àYtXÖ±—X
Bc,£«âW“#"„ J©5\FË Oñ‚3TPdı`\Á5¬$÷ä™8 w„˜Ò$FkŸ” R`qëIi À^§ò€Šf<©í ¤M3Í`¥Ğã•`€J¶0V‹!U0ªqÔ@5P˜‚1òÂ%I I@õ"J«Ö(¥Œ©øÀ„!­e³Lb BŠ´€K43+!ø@Í&W	@ š6f±@	 T4€L
Ò>9¢õS‚q¤0¢hQ\¿¹GËå7$½.‡Q ¨û½Zöi»½ûµ"Ú¶Œyri=GŒrÃ´‹öàí¾CqfèM \vN&µ„V÷Ç]{xË&ÕÓ¸¸ëlay?Ü( âÚï¾:êóoİƒí®SöÜÎïj¡¬{¤9Lšf0!1‹´èºÔ¸ÎéºyMşÛ‘¼.6İ×‹m>Í§	âYˆÔ®]İ\½«Ü¶éîº-í.İs¾h:ÄéJûÒ=övfµİÇp?a½%¶t‹‚Øk¶?SB]OJ–e×MpÕ.ï¶×wWß´ËŞ9×,—¶ÛÃ©5jé8aªê]İ]ËµâİmûËöv[OXÛ¸2óé›^àñ¨™i&úkåœ=ß:¸îí«;“®¹»Àæ¾û-µÏ¶ØJ¸*£Tx“Zã{¶‹ıÌor´Ú>İö[:Àª4©²ô¸RÚGY2çf#yáwáÌkö¯k¬=TŒã×Ç˜ólÙ­qÎhi9G¦0¥¹µ)gêÆvƒ¼.7õ5Î¥,
ÔõæÚõt×³ H%ÊWVqèrH
„@«1:I "BxŒÓ("¹HT'İŒqu0@r×ı±
´‘
@Ìå*†´8™Š“‰-‘ÃÆ gâR ı8(1(Dš©’à  ¨†¦j’A8©Yë2	WêÊ^ôÑäp1U—i¯½rlhÔGû²f%¸$ËÈïGm÷^Áv÷ßİİ²éü–äèÛÚ=ˆ\š<—»¾¬/mìn]e«WK¯^Üÿ våâT¾Û\ç|Ò˜Üs®^ÿ ÆÜ£rfá6­ïC@mš<%œ8˜‘RUá„b{›û<mAñ›İ¦ğÿ ÈË¢Ûçÿ -Ãß³zŞ«.îÛİÿ ·ûšÍ…7¬Zıı„hæîBu?-#Í´îï¥ëÃ7–mïlínXÍÅ±•»­o¸ˆÔb®Ówkq…UípsŒ¨1ú"ÆÍÅ¿bè(o[&“m"izÃnËà’—ª=.GB'O*á=Ad’À	Î°R’T%G„1úTRT8À
H¯à`4‰•ğœ&b¸D”˜ ƒE%&§òñ‚¥Èš¬‰4Äâ0H‰34¨Æ)%Ee0g%RK ¦AÚ2šHÌÀ
ZÑŠõˆ+ìüà¡ H@¨²)#Ù`53¯Cì€‰r¨Fˆ.¸Ì		¡ûàe«˜Â‰!JV¤š@Qq*Š€”+Y….XLã01¤ ´…Tk4–P5iÅz@ŒDÊÎQ¤	! M L9—}´ØåîƒıĞÛ `Ç’uwÓ³ß¿¢åâ×«›"ƒTê£T×(å‡¥ªó¼Û6öoÙşã¾x--sÃJfˆ1¬oMsSnÈv÷ÔvöÆãr§o|hİ±¯}»¸$ÓıÑÛÃ;L¶ÎúŞÛ¸lİ74ØÜ¸\µvÛ½zœ~*¡áwHc1ÊV3º÷—6¼åİ­Öéµº`{.KnH‚
(QfcysKv6»£eÄêcÂ[.şÑyp$g5ë‚Uwo¼ÓuÆïÎeÂn^)U Ÿ(bÇiXÍï.Î/wzÑºÓòî˜ö½–Æ )­Öî%i˜–á°p}ÌÀ/Şù¸½yo¶ëMÀÔ›VÄ‘hK|£ÜuÚo0é½Ü»æöÆöîÆå‡q6¯ow–·×¦ÀşØkİƒZİ)¥v²ı¥Ëoùí°ÒËx\şÛ\Ç1åÊ^ä%f}A#¼ÒG›}íz·-ëµnßÃt)¼Òšf€€“šFµcfõm¥–ÃLÈésP½p©l€ ¬fÕjû°/oî´|¿ì°Ôu— 2BƒMØñíÖ×YÙ™+%¯\#Òâ‚à%Óä`q2ığ*($D²3À™×àêNøAÀJPÍd%)32ˆ%S‡úAÇÂk–pL€C×¬PËB	…h° \G§)”0P¦`ÌŠšã HH;¢œÎ1Ë¦‚rÄE&Š (^½nÙ/¸±³gî·Ì…butÓ¤rŞ·¬ËDçoÖûkÂÜq7m¸ò<Èl’şæÙùv×[°IoüWhï–ÛÛÛg3lıëÚ{rT1¿XÙ ŞGA½'«ÍµfhÔ˜ÇF@hWLú(Ngh9Øšn6×X ©~‚Yáê3fcZÜYT8ëÖ¹[|~æüìr›mÜ§üVô¼ñ1æïgÆ;vÏâ§ÙWşØã­_ÿ õ«³¾Úé¹³¸ë {!§f·[–9Œ:ÇHæÄ–| m„ÕjñlĞÉôĞ#0µ~Ó¨(<(õG#“T8Å"hF¸§ç 	Ó*GŒ¦
J¨ ©‘™ È#SQÀÁ ¡õNpSR ‰ï‚)Lª
Z‘Op@¥£Â«0RQ)î‚Dˆ
€ÒTU\}½`.ÄäV$¸’Ğı²€<)X. &­ )<²„B)Ä*øÀáŸ°%< €’	#úJ
‰qø¦EÇÊ"9pLjVp;~è  	êYù…€EªfN£#öÂmA‰¯²(•'03¥z@0JÈÀ0j?UOßŒ*t…AŠF™H&&£ïé¨Ò¾¡mIÛØŞ´H“uØúfÔÈ¢ÇXé§wåŞÿ ŸsC÷µÃK@P²!e8á‡w+îŞâı¾ïö×‚_Û¸;Ô5)?ÎyG~==YÛf™¸îµÍè»ªàqk]yHô½²:OêT,zfnıYıŸ{î7;;;;îm–é·usA2šˆM0™•×-n¸îñík\¶æí¡¾Û[.4OhU*f×"¶<øñ¸\åÄ7ÇzíÛ›¸i@ºœ\òd[«³Ù˜N.ó÷EöËm¦Ø´Ö´MŒ  ÒWÆ9×mk½ã·¸l‹VßµÛèuöİ/¹h3×%ÔSânq¬ª¾Ï´î~×k¸µiÖ9Ì³-~à¼–•U¢Í¢qäå»˜vîÕâ·¼?si¹¸ëÎ}Çm¯=ÍÖ\Û [©Iiq’å-ÍÊ6şËá~Næë…–-\ùÌ(…SN—*ÒQŞW§WuíıºüÍÓÔ‹¯¢4&*c®‘ÏjÙËÂ!™wÂ˜ˆíR,7W˜ç,Éö¶ª×î:áİÜcí¹—ƒ54Ë–ÜÒàXÍ'ı¦<·»¯£4N=d˜Ç­ÅUQ0)X(˜%süç •>È)S$N½8:‰…+ÓHüà-5ö‰ª”0™ª¨JÈ’’¨Ó^Ü  ¹Q¾¬±>‘2AšÅC€„Te
A!¡g™9À9ŒåX¡TÇdœö†—Ü#K• h
}©†–İZÚlİ}ÿ BÕ·r¼£ı ¶lŒUÇHÆ<›\»ë/jí7|†áÛİá^CœºışèÌéù“F¡$0Ğ\fà·ÕÆÚe»VÚŒcCm¥SÎ=S£Î¨¢¤yçÖ(x’T*'”˜à×±È  â€Ö¸/ı6Å»wWÈî6nD(Ï˜^ÊÂà‘ä½?»Ğºíÿ ı7'İJ©±É~ù¤MÉÙeğ<5Ât¶-í+d²CFk=9$tŒU–é¡›‹ÌEk˜ÛÄ]~ÔŒ^êªĞ-½ÌhV±Şùêj‰ìä˜I:‚«øF„–¹`ADˆ"ŠT‰$†yE ” É‘•}‘ªÀ HW))øÀ5– ~İ f’Ä~p ôÉÜ«  *¦@ •ÊsÅkì€	ô¨Â*§H ÏíX( yÕzÁ5@TÕ:ÀDÈ‚AC,ÔA@
R§ 8{1‚ÒCñë ~háùAH•%0’PÁ!Ò1ğñ€U‘“pD4È
á,=°M
!Å'6’¥&`˜ª@«–D}İ€h=zt€0'¥AR•*3ğŠÉ‰•‚Å—-Ç³”ãïlQÏ Û5-¸&XÍ™˜j\Wû¢ÍÍÛ½mÖ€yn–­$sœ
˜G‘êËÏó¸æ·›	òo|¢à>cÃšŠíJpMQíâìå»H¿¾İ1¯{ˆkZ}±§ÒL•jcÑ#…PµËnpp;@õ;Ô
HÖË5Çwfçc©–À{\ßïAÀ„öF6ã•½vÃdÙw6Ëz÷1ÅÌ¼¦Ğ*ÒIIB2Ê<ûqØë®Ò²Ö™eöA³t†’th ’qlpµÖFoiµ·q­ıÍ¦ß: {Tênr#6ºHÜxm³Û;pµmÅìa_”	!ÏñA«8çK0Ş¶5nvìÛX¸M²â}*5=ÊŒÉ%g”Xäé¼6É¶·Ú†´m/}Æ|JéJLš“Òå›¶Âõ»-iGÚ *7ÖÔh#Û­yêü_7ÿ ¸×i ô™ûâÚE‡!¸/´t\6F ÙĞ&H‘#¬qŞ·¬cxûW›yß80İÜ<8–ÙB¥Ä¾ÅÇ;CÈ­:G={·³8q ¨8-#Òà@ÔĞ¯ç IôÕŒÌR¨e)Qd%UÎ8:¦Ò§ªüC<Œ Ò@@Pø˜jU'P;:;öX)¥—€€U+B¤şPBÔè´ÃÏ¬Leªb 2€¢ETkŠ¯¼tŠ)¼×-í\âÛS½¹8|‹^£\Êå½ôj9ß|òW9=ÏÛ¬ôŞæßşS•
@·Çíœ›{gM5¸kò<¹êí:6Ş×Ù1‚îğ³Hÿ £i†D  ’€‚;ñû¹o} ÿ i¡Ãï®I|@…"iÒQ@Ò•9ÀHnª
’øvÛ~_3Ü{B—´äí¤”¹¿.áö²<ÛÎµè×´Tµsäw›_&Ùå¸v8	’ıÎÃq¤û-ßŒçªã£f´á¬–øç÷Æã*{à>u‹®øªÚø‘6îE½ĞöZ«€vİÿ óY2ö´ˆé¥èç´\uRRYGD%GïQ QELúuöE™È«8 ¡Ä¢ÈJPÌjóLV$€²O¼œàRTÇë,™bj% ç&¤É‘yÀ-Zfh~ØAàªMP98(D3"  àÀ-`¢{hlÃ1%ÀJÊbn^Tƒ2­ ”ÆjBP’0‚ î²2¤¼õNc1ÏQ®P P$°?”!P‰TÊ™™Äôê‘@I2"©—„…V`Òœ’3€ŠäH¬åe9â•3Îi…V@¨	H¯IÏÇ¤>ú•Úæ6W9M€?¹cVı¦ã›¼ñ;éêëÇ¶;¼{õˆ¿fÛ·£KÙkU›öÈrÛgÌô‡IA+_Ltâ¾›Ç Ş\Ñqêõ¸í_3SI$ˆ]ÓöGš¬5´#šä{Ğ4 C‰¡ÍTÆØV7Ñƒû€ËI.Pğü ªÛ}Ã˜¥À?ÿ –Zdª‹á­FweÉï­9µuÀêkMBÎ‹Œr²Wikhã;»—Ót^´–<,šµ.#$Çn-]uÚ·î¾÷„Ú³ºÛ46ò/Ëø‘Ê¥Í*Éc…â™t?¾nìÙnám¦İ¸Zí!£ıÁA_8Ìãq»a³ñ]ï{—÷»»KZôƒgû–® 1x\ùFæ˜g.ŸÛ[İææÍ’ë¢æİŠÛWm¿S!Á±,o³›o;ÆZ³råÇikZ\÷P‚-Û$‹>NõÍ½­»n|’Û«næ×s+WxZëˆE·"5¿0iq’ƒö­È½ã­[kCi¶˜ò®¯Ì¶QI%Êƒ21®9×,íWÆa¬wr0h@ ç Š$üK ^i¯‚ê)”puIR¿Œ IYĞÉÛRâª €	
€z–}<`\¤#. &`	‚°€“\$¦i_õ€
yÎT¨‚’4’0IåçÍÎæË¶Æå÷‹;}î«—¯;ÿ •ÇífâOüIï&ûgóÿ NúÌ~NiÛ»‹İËÌrÏu„_æ.ü…„ ZÙmÎ†´d¾F3†ºö×nİ¦ÚŞŞßÃl¨bq÷Ç¦L8URd@2YøFÉJ¡&h:ÅB®)D€“H2D&>@>ÇsñWH[|†ÓwÇ¸_l‹ì'Úèå»¦«.Béµºí>HŸ]Fçóÿ )aöç’=Œ3¾;¶ë@—´®©Ôa#ùm54§Ës^
Ñ«8ÖÓ¢NìvßrÛ{íŞÅÈnlä-XáfèQítMoî›O_É‘P%@Gw0j
zq1BéïŠ”Íâe?ˆz…rñ9ÁQQŒÂÌ$ á÷@)jG¸ÅYNµ1Q „JyE%\g5ûyÀ ğ&LÄ‰™¨€	 N•$à9UQGİ8êUTR‰ CŸ¸§H2BPÑ`##"HÁ<rˆå¨€¤ÓÙ ‚fdÖqPµ €Hş` H*dà‡,ş‡ñ€• &™„Tç€L³€–ˆ¿P 'Ş%Ñ`"dô#¡ÆJµ„ş”‚"“—Â<§“	L:ÏİÖ!"k‘ê@J„+T€@!:c„ú£ôÜ®Ö÷'Û–F½/;‡ès
êbÓÏi®Úoèñ7yvë€Ş]eëÛqp9í ´“+o&‡,ã×¦ÒÆw×'shÛ¸JTÁJãö¬u•ÆÃ¶Òtµ&¤¹¦ETU‹i†ggÇØ]àç#´–Q­¢)ó>Û;ë«?gg·³¡Á Ò©TrcHãv®ş1´ñ{vë^ûì(-«@ÖT…"E
©wgIàYÈ9»e¿%Å~c„‚Šd ómÉc¤×,¿pvc-|­æ×tû·l£nmT†h&NuR±×‹–Ş•Ç“N™Œ—jqÖï_k›p)¶é=ÚJC¡¤vµçwÎÚÙ\·´Ûím1p(µnŠg$Ç¬c½gÑ±möß»İ‹¥.l¸ç/­À[¿½`RÒqeš»7J'Â¿ü7Ú|oúÿ ÊÃŞßİnïÙİ®ï‹{îÚıõË*õ§j~×yeÀLªÚ¸—É@tÌVÆÑmŒ§”&ƒÈ L˜p¦¤¨ÇúF™E&§ê(" DD¡Æ "S¡Äu÷ÁZğyL	­+ _QE¢Í@äH$a Hi$©Á2O¾ Y S§€5
TQø€P2#ï š¡Pá"E)ùE(†šhÆ.¤I”Å3X^cï|½›/İ;åêT-`qßùc;_Ov£Ÿ}På.İãÙÀñ¤7uÜWY±²VqÖˆèâ	=#Í:Ü½¤dûŒ³iƒseš6{66ÆĞ
i|Â¿Î:é÷­ØzVJg*/ìâ(Pu<€cH•ĞÌÎ4„¥’:a g:Šù@`û¬¶ÛŒå Gñüİï'{‚l<Ÿüâ9òvuãï…‡uY»k¶ùï“ÿ [}¾Gnì¿iu›‚Gş˜òØë­n6nÛ»§q·bëC¬í¼+Iò1Ò3WÚ.Ø¸Öªé {#w³-W}~Ö×™í¾NñÓbæáÜfä„¾BÛ­LåórÖş¨İùll-/k~]ßú¶ÏËsMu0é?tzc‚T'*UX %CYõ€‰(á2= ]_HÔ™À M$R~Cò€JBš'æ B…€IÄ‰šÀI@ 	½ RB¨TÂ .-‘&(5KX4’
À’‹pˆe:Ÿ²ÄDT)aœDÄ€ñ†PÄ…).Q€A,C4ôÌ¨Ê 3@
S"ô€‰'âÂ‡§ÍVu"*L¬°+ LbdzÀ?JS(	"8	­ë9I%2ğ€T(Ó'"H‚e dªyÌ@'	€Z´$æDT ñÄO¨S@’ÈP€Ä eIE P¤ ¬ŠœA£w·ÒÎØïk7âÃ6ûëŠ.^c}'­ƒ²"&=›×l<“õøÏŞ\îî¸}·îömÔæÙ>f°¿ü«’R•Cg&;’eÅÂï6\€ã¹NØï‚‡XİZs´­õ ¨}±»·F¦½YS²¹´ºÇ\¶X\m·‚Æÿ ´!!
Ÿ|qÎ]1†ke£l\û£UÁ[dê{üó
1Œa¼¶ŞİälÜßíİu†ŞÌÚ/~¢À0QúN¨ç¾½›uv=ï/°Úm›gˆÛÜÜ_×İµê´û‰FÔŒ£Ç¯½İ.ê»;“qopËBËâÛV‹\ñóu¸¨™ş±è’G+réüj[ã/lÙİ[½Ó˜Ü ı¦É¼ºÖ¢¹ÖZI—û‚:ã?ƒ…èëŒ½Äì8–·a¸e‘&n9	8´;ÒZÇĞ¼¨hI6±»¶ºÌOîÌÖÛ×û1\¼Ë»}¾ÂÍÍ«¶º¬ì-9«³¼Ğ}›¯
Zç*¶ãš=Y‚cÿ ğé=¥ ëÜ9†ÛÈgÍ´ğ¶Ôm·`t~®©4{UÛ¤@4ªõÎ;G2(““¨>ø¡…ÙS¨@A*(:˜’fš…|`9~ïê‡`l˜ë»ŞvÎÚÓOÅu— v™«}:œ%ƒc„¹ìôı=“á>§}?îMĞØqÅ´¿¾ ¸mŞó¶{€
KEàÀ@ñ…ÌïºXÙlï6»…mÕ­Ã˜±bë.–ƒEĞJ‰,©e×!à‰×¬€ßI!yÏÂ(H…,Ñ|â(«é$ IÁQ$éãUëã1&„ ¾<ŸJz¨00¿0¹—ï±Á®¾NÇhã…¶ÎıÑ}¶v×W­®ñîîC˜Û|vİÇ‹áÀm»#MëŒÀ€àç˜’aÒövŞ7h6@&Æ-Ôÿ óeÒ‘ŞLGÜÕá')÷Ê+'BA 
Ï<â„N¯P †RU2RB¢xED˜ñ•1JaîŠŒgtmŸ½íclßú¿µ¹uÀ:Àù Ï"ÈÆıcz\YE±o˜ÚÚÔ‡mÍñÍIú/[Ğåò1æ®ŞˆvNíû®Ñá®Ü$_·µnÖø2!ÛG±QšÚ‹Úul|‹s¯Pcnm¿­n/v74vJİöÆÛ÷{BÅİ£…æ§şIG,:kq[OËÙçøİ‡=¶	c˜ÙíùmO…×˜Àr!àÇ©æ³º ¢yş0B$ƒ<¼³€	’"(î™$ÌÈÔŠÊxÅ’ı'eA ˆé‚MH! Ôh'ó€"	((&5Ö(Zˆ˜(ÓRR"sE~U%5€Eõ2Ôp°	Ef¿H)j‡šAW<:À53úsÊ .’¡‘œ#”MV¤HÀ0ìÊ$–°PÖtÊ´ê'51På\M Ê(NhD8HÁ@È× pë Õ2¡€`äfUVK&€p†Uû,PõŸ²BA…T‚‚A—ßášs(‘÷M ˆ©Ìi¡ÇÂ€L„Ğ©JyÅN@Ù4ÔŒ @@µ8æ‘Dí‚†‚“Bä«}“¹»‰ïëüîóq³Øîxë7Ÿhl·ÛO·Ñ³oË±rÙeÛWŞız>K½Yòù[o‹Ñ&1—3ÿ ÛÇoq[›íÈæö~à&ÏFæ×5²¶ë­C€6ÆæÛ5jÔ‘¿©lËX™è[/ãÿ ÈÙÜ^ØwvÂí†´6ÖÚÅ§YÜj_WÌ¶ùÃLã^]Ï¦9¾ÁgiYvñÉ7lÆZhĞïœëeÊ%ğúH­RÓÊ¬øşëîMşß}ş#·/\ŞmClí™òn8\p™§Cˆ”ã?NOV¥Ëqä;ê¿w7±Æî_Àl·;;/ä¸¸liİ9 Ün‹gæ8‡,–$°ÌÚßM;kŒŞØæ·{ó\ë¶í³ot÷9»f±a€êxÕ"âzBo‰F,ÏVßkvíá³jı¢ ²ı¶çk¡l›âáµrËtJ ôâ×Fs•³Ş+esmvç÷MÛöôY;ÍZ¿±h–27š¡Î’ÌÇMg_ëúË;Ùı]™O@>4ûã¾H—(hSSPª’¾3€TPÙCY
DA%¦9E$)L&˜ƒœQæ®Óş8v[ö¹nûŞï{«ä¶í½vû/İÙlöÍİ087kjÑ.c\4Üºã1ğ¤£vt÷{n^)úØ\ÿ Òıä{[‘Ü\Ü²×÷øÎBá%›Ş:é&İÃ)éxÁàÇ»K6>×mvÌ¬÷ĞÏ©·~wÆ×ŸÜµÏí~ZÑÚrvKËÚvåÓ-&AöŒÚ2\Ü~S§xë¦ş–ô¿â¾q¼–Ç—ã¶œ¿|nx½ı›{–éûF¦¹0Q	rÕ˜¸«½EgSL|=±PË^pÉ p•2Ÿœ QLÎ¹g2âS}`)n¯9¶ƒmWï¹¶víÎåÉ/”ÉğŒmq“«Dú¿İ;c¶oì8–üÎS‘#áš	İ¼‚ıÀDÅtê2glzG}gL±¿J»rŞÑ›k-3iÆZmÓ!qÍw©än]Ôã˜ ÇIÖå®#«‡¸…35¬Ìã«‚@‰6oØDR A§Qï‚ƒ"ˆ„PO	€Z1ÆS|Q&Üqc¾ún4äïIÈÄßhİsx.>ÍÂEŞ7q¹ãncéµpµ¡| 3º·h¹Ö.wà‡cË^ºÖàÛ<ƒ¹¶›Ÿ•²‹…­*	d}©ËCí³r7Û;Ÿô¯4‡°âË£K½ÄÇ:ÔiDùGİì‡p•ŞÔä÷<=Ë«ä\s¯%aè×úüÿ òçÉİÒADZšé—#VÍg\0‚ÑÃÈcí‚¢¢•c ¢tzøÁ½"A&Ô‚‚éD-eÈU(, qÁéá"õÂdû ˆ~§"CYg!rDø*“Q¦•
 ùÀ-DQ:]9ˆ•Zã< &–Bj²€T´¡¤&„>sÈÑ`£R†bs7g	Ö
bSO×ªg
¨RE|ŒDJeù„Š†Hœ€IR(rP€? %R¿€“U|RÂi ÔÍ'™Š),LÌ 	P{? 
² â²BJD’†³‚™sE®k  %HøÅ	T5üâ‰4"¹¿A¨À‘’Äßiµæx­–ßŒî¡~Òİã}ûÒ»jwËËÍº´’Jÿ u ·8ñ]v×»×å-èÜøşKekgÇ[4·ojñõ–¼©¡ŒÖÅaP„šN,Úb3eYñ[;šÚ¿{»ã­·unÉaùöí:ë.JÙ!ÌÔ&mxwXšÿ ÑlKlÎm¿<]½V·®{M»NsÃ_a÷¾I}\Õa-ÔÙ‚B^ë™+<†æÆŞÅËŸÜÿ Ó›—¯)KwØç4‹Œ(–œX[¬|.‘ÀÆbÙ2¸ºnÛ³~ÆØku‡›w¹Ä™zÓn‹ÔÇ9¬-’¶qÑQohß^¸OÉ·fõÍÇq¸³~Ñû‹.`¨eÑ­­RkS=ÿ ñW6ß2ıÇ|‘¸m¿m¥^òÖéÔç	4Új•óWuV2ÛmŒhFµ¡#xÇf-ÉËR¢ÔÖfÃOZøå )3À¦qDK•I¯IÎ s§éÅi8KD.ÃúJÆÜí6»m©>­¶ŞÕ‡i¦«VÚÃïÁÑÎ>´}#áş­ö–ãÜXm¾ëØØ¿wµù0â×Úİ«ä8ê³x·KšìN¡1x÷ºÔ³/}ŸÎí»wŸã·\×cØìw–¯nx}õ¿›c]›‰qcª	œ{·–ëqİÏÉq{>¨qû–ïe´İñ­â÷6-^Ù2ÓC,\`u°Æ´  iI	GËw«ÍFDp ƒÒ%'e"DÕKM±@HYÍÔé8 É&BË8¢ŞÓİsu{wd˜]˜!·—ÄÈğ}öÿ í×Xóï9Ëóú›¼½²Üjá{X»ˆâŞĞ­»É\÷W€¢Ún·uôÃYl»×lñ£‰âlXÓ¢ãÀ¸öŸÒÑàß¾:ë1}®k.+"(Û¡P-pÂ š’Š*=”‚¡*ş)8R¤¦¥X¨q¢ò¤Ã°ëkœcK»öM_FïkÊÛhÁ»«M.#¢µÑÃoW]Uvnı¯~r	FrÜ]ãOéuıãdÔ[¼ØåêíèØ® á5B g–	û¡cyd¾V·I`»—¤‹(ÅjG/ìÍëø®İİÙîôXî­¾ClÚºu¡}‰Ô¾ÕÆÇ£O–f7ìí¬¸ËŒmÁ ğ<#r¸.(H#6‰Æ„UJÏVVqı*«1‚*Tåé=| sR0Â¾ØÉBó gŒâ­ÇJ™}ĞG8úÏİùÙ½¹µî>ÉÛmw›M¶éŒî{–—­ìîH]²åFúˆ%®Hc.œr[Šó'3ü½ú¤Ûã¸İ§²ŞmÕ»BöİÛ›—‹J‚Š0@ô·¬o^<÷®›k¬í×-õ×ù-Èíÿ wşkq³ÚÓ¸ãvÖl[Y@×P
ÇMuã÷M¸÷ÿ Š•ï®ßÉ¶Úß·İ·…·°†µ².+N’n[ª:Î>?ê¹Y¿´c¯}dúùÇòMo1ß<Öİ±ràÚ6Øréji0+¤G=øôÇHŞšÙ·êíğŒ•ÿ ®W­íİk†î¾jï&÷~ësq†ŞŠ‘nİÛ`ucÏ¦“?«³Õ¼˜ı:õe;[ù3ü³ËXÚ¼Úî7İ%§a»Ùé=_h5Í-T˜ï¾šMsœ<úémÇ‹ÑüÖww±µw—ãìl;‚í“»İvè¹ûŸÛíşgË]j;I8õ•¿=Öôëí~Îm:ô­—ƒúÑÙ<­¿ı~õœNèî?d÷Ş&æËç¡£rÀX	Á¯Gg9<§Y‡—íî—¾c ‚KZæ¸¸±ì:ÚZg©¤( æ#«ÌaÄÏS4Š‡­zXÜ¤Gå 9:µL È¤À8û i9x®UC/li+é®FµË˜5¢å é&ı© )Sê KÀE*gÓ3 …½AMJªIh D˜:g“P&1EI*˜M'TFmwÜ &ÒàJºD!„@ZİáøÛîù§lÆ_5»d›/Ÿ[zG¶3tÖ÷M¬XØ±m×²İÜ°û­-xsXâàH(^Í¨ÎğÏJÔäjV;¡åù×¸ßß¾Û×÷–_fÕ·î•u1·ypıN28Ç–Ì;É–OkÉînvï%ÏìxÇßF^½sfëÖ…×Û$Ü{dI“§ºææ—¾®ÿ Önâä6ï¿ÄìöÛÛÿ ´{š·Ş-0mÄ¹ 32HßY¬_v1Ír¿Q-Ûä÷÷wmÿ .|§¹Xoê V=\zÏÍçä½pô$O¡£÷	Gmœ˜òŸ™è&¦1•%+1?Æ ‰(Ğ$à³ğ0(R‡ùÀERi1C k>¤×Â*™•ÁpåGo·ävèëËLÜZshu¡ßŠálÂ¥—=›‹O`RÇµÒÍzÁ5ş§vÖËkßÈ6 ¶Ã¹Eöˆ"AÛ‡¼,QôtÛ¢ïÇ;½ßôhnGÒ.Æ²Nãü>ß[ÉS¤•Z†<;üÕovõ©f”+!ĞÉS5Ol’ş”À™| â2Åqü£H³ßr,ØÚi¿yÆŞÜ=Âİ°ô'Sœd1)ßoµ×É«÷ïw[ìîÁŞòÜy}şGgaö6mcKÅîKyéuÆ¤…”y±6²=2c5£ıìïØíöV7cUËM7÷—¦ãwqqâå÷jôÚi3ô˜ïœÖ6èîbáÔ\˜ıñÑÀÁk…d0éŒÔ­‘ôàŒE•_„Ñ$|``Š™”A#˜, â YœOÜb¡‡$×ÕŠb %©QQ?ªYŞîİõ'‘á®ñî³³ÜğL½³äÚïEãeÎÕmu±åÁ4!Xå´oVÕ´¹¶c´ ä¬•NF8»RpT.™eâb*…İ¶ÚëtºÓÑ?PQìéYî…fôwc8Ë;›‰Ül¹$-ÜÛ¿[Yóá*à†^¨M¬\JÊnûÇ†Øw6ßµ¯ÛÜíwÜ†»ü[oÚ,eË|À…É?‰¡O¥c¯?/fYğö™·á ìS8èæš:(®g1pd}A%B?¤VKYÄ?œˆ“RÓäs^Bù’"€ïë„Pş`%Ufƒ%‚5¨ºÿ ûÜæÛT>óš:H(=‘›xşhù¯Íïúİ¥Çi¹nãö÷„šYvÛˆC‘5Äz97Ín¥Ü;ö2ö›Û‡¶ã[môv¦éTä€õ{hï®Ù[æïŒävÜu®gŠÛÀfÜXÜí^Ö†*5z”4¤ò‹¯³–Î?É÷ógË^ØmÛÛMN¸Ï«æŸÒ¡8İ×1‰¿Øl}«Ïğû›ÛOŞ[±}ìÓbÖÛv-¹”Ê×WVGšëe{tŞm¢í†q[.ØıİÎ<mw÷¯1âõÆèºMËe ÊMÿ k„äèáÉza‰/›Ÿl;oŠï/ªíÛr÷ïì8æãåò7öwnY¼æ[a·jÀ¸ÒYuÄz„›ããí#\¹’Ùİ¦ıKì=ÿ Ğ>çßvıÓ¹Ü}ï™kİ)½se½Ü´J&ïmp°ŸúÖ–³ß$ß¯şÑòæş—µtã¯Ö“¹ı‡nsWšÛíÀã]·j›{^DzEÛ?›Ò&ßé&TŒo¦;5óLû=V¥HwéZJ}c›‰´Ñq•)8	‰ÈQkáø@"UÓÃ¦0PPU ÄÈÎ dË<‰H ß¦Xœå€–½=MÂ–µPß„O¯ØÆ„ƒÔdQW<«0æ¬ı&dÉ€¹!)şå	_º‰MJÑ3ÊQB&r*Er?œj(­@I~b+)A©r0\%«RµÆµè°ÍŒşÆ+&Ò·İMP1D@+Û«{;7·—H¶Ìu÷¯ûm…Ot-Àà\'#hXä7÷÷/on\»|?Ò¦õÂä4Í|ûëéï!´sİ¶sÃöÛ–njúLˆO
EÓ¿VwŸí-¯jëáJïïìï¶á'`As\’zé›˜¾‹¯¥Fçÿ rìµÏù<m¦¼”õœâøÇ·O—óxù>oÉêLŸšÀ
	­N	fV¥¤šâFÍ@ ¡§„$ş¬+å ‚*$ÆB$¢*NGSp2¦pÕ§)plúŞÇ³ºìNEÅûÍ“]¼âUÅûE[­W`×Mñ6aéŞzº|wÏôÿ ‰»Éo_¯•,s¸¾-³Ün/è$~‹M(ç½ò¢˜Ù×\¼(8^g¿;—oÚ<&®Cœåï9®ôém¯òıÎõÄ|mjsµ8ÖU)Ùq2œ›>„ì6[n'c²â¶ ~ÇÛÙÙíAGÊÛÛm¶’Ü5Lx³”\Z¡£Ëıb*Eé#C%LN‚"_4*J+0F1`J&Ue÷½9íîÛ‘½g,Üî¶BÖÜpÍfûuov…ı³^Z.~m§Vb<Ü¯OˆıLæù[¸v}±É¸p–xf×<æ?æşÌXv·^¼-’Òæµ™¤^-d™tÚü]÷²;ƒj{oiÜGl?Àò´ßó®Ùù`?,lâÇ\?WÔd#s¤qÚfâVÍs»;vØ»qûÿ —gm¤nîÜ³~Õ¸{ƒZo>ã	5&5åğ¨Şï^ÓÛÛİ^3µı¶ÁO%»¶ãso³ /ş¢ëm©SY(]İÏÁYÚŞŞïwìÙX°ÀûÖ÷ƒö÷…· Záiè÷êt‚«1¯ìÎââlmoî·WÎÙÛWwö{–ü½Û.8€Æ|—z‹Ÿ©ºRNZÃ)Š¶=ÙÁŸ±fòØæşcvÿ á·-íùyË¥³uÀ¶‹ªa&	†W6sû6_»³åßo‡ä,èqÛn·6œ.ZººnZx-ÖÒA@ƒX²û³ã}:¬9ŞúíîŒÜïlò[-æùšY³Ø7weŸ>í×¶ÛX© ¢r-Y¥µÏò3‡Ü?mµâÍöãv6ü«·û[kfÍË}»vÇÎº÷½‚Ëm†zW[‘®ğ™ø5¦}Gäû£ê—o÷W¿±Äp¶÷àİ´ÌÜî¼co[Ş›cm}ÅÌ·uÏ@Í:Zç*K:ôv®óo'Ãö¿+{‚ä÷›=ïy›¸k­ŞqÚÚºÇİc›q…¨ëZ†¤QQ:Jë?SnÜ[Ûi×·ù†Ó•ö^ç’¬3lÓ(a2×w×9'Û¸İ¦ìÙºZ~UÇÙeä)%k‘@Œ4å¿X¹ÿ ª•Ø;Nåáy'œuÏ—¶çö»Ş<íšÛ¢m¶]fô€2p*B‚)xõ×kŠmqÚ4>ÇúqÏw…¾Çï^Öæ¶äxWï6ü§=Ìo7\¥Ë{½«ÖÛY´¸â×››kºT5šJƒ³1es·ê––00ĞÑªN!¡)í‰Â‚
(™#Ã(¢!Dı+í=b³„Zò²Rœ”C-dÎ…0œ(ñq@	B¨GOÂ*5Şÿ åö¼/fó½ã˜>}‡m6¶ŞP]¿x#X†TR´”fºqÌíæûœ×<ûÜ.ß]/z\ç€óê{KI
I©ºrøÇ¯~)µt7³»s‰}¢^7;›z_má¯mÇ€ıO-WÓ»Úé®¬îõÏ~Í»-éûszá»p[v¤"8©9Ï–ğËAŞ}>eËß¼·º½whÇ9û»wN›Ô:‹IPA
…V“)ô±Õ³ğ¼Wbp&Ó7[Çõôı½Ë–mŞkm6@Ÿí¹®ôÆ'ê¾‹™–Çvğ<ÏÆğ;NUÛİ÷®2çË·yÍ@Ñ¡ª £ÍÉœLÃ\mo»½Ün¿}¹Ş:Å½åğûO~›l¶vèû¸¥VÄÙÛÇ¦Ç˜àøO¨=î'»¸û{şÚZ~ÿ dò­ÕqáöŞ²ãu[¸Ù´Ç¿]¯Jø»L["âû/eôŸëë°ÎÛ½Çq7¬ò›nctÃiÂÙ´wµJ·æ–¥·9²Õê	Hí¾ŞZå×Šc¤{³ƒçv½ËÄl»ƒ`­ÛòV[¸·hM²ÿ ‰#•#„r³š)¨
â‘Y%2
­8}â©@r(` ºf €TŸŒ*¢jEûà„š}º@À(Dª”Ø	j‘”è„TIA‘Í|e @ "JGŠ°	t“ºp*AT2éã-M%DÁ®**5äô?d‚§ª¤ù@IA(&VXt€å)qÃ¤j1S%gĞf¾QDÁTšÊY®P¯êÔ^;anïllo›Ïÿ o}¯X·¦-GµŞÈá¾ş‘ÛOZó+İ;ÓÉ7oaÇåj-ù„È7â(•U‰5z-tÿ ¦=Å¹vñ–n¼€ù[+Wá<#ÉËÑu–ºwrñö{£a¸°öÛ³Ï2ÃöÛ]ÍÂƒ·"G]ÒÌ4¥Û=ÎÃêÖÖöÓìr°6níî´>]éË$2p¬}-/éüŞ^I×òzC’qıĞ¬IN5·w%˜ËRËc*EÕ
¤Ä	Äş£§¢$„Ò\j„$±ó€Já%‚Â´Là¼Î	„Î^Şß÷.Ï—ÛİÜÜÛs×ƒ¶<uÛom·:îçĞÛaÎ! 8	%"m'«Úê\oño¼¹ıØäş§÷«öî¸?õgã¼ÜëŞn ¶ÑÕ–İÒ,äÖN‘Ã}®ßƒ¼vGÓ¾Îúu±»°ìş)›ºOßoî9×÷Û¢Ò ßÜ\W¾s“{mvîÌèÙÄ¦O¦€tŒ)iÎBrf¦H™­:Ä	Ò%$•Ew«­ıîä¶Û[uë®4hS‘¨weÎŒúu—ïMÛynİ·ó;›[–„nÿ z?ôÌcÊ9Ÿ-¡¥AåÚÛd_ë—úCôîæ÷mş_‘Şr|³˜Óµß¹×­Y´çîÒ^\àë6‹WQpqr©‹×¤M¶Åzïim/pÃµ/\·ÿ h´Úm½…«?"óvö.‹Í³ó-–†´=­:ØĞü¸p›bçÕS˜ìÎœÛî¸ıówáù#hrüSní7­Û»Su·u¸)^‡4¹²0““Êªr=ŸÀr;ÜSö­ÚğûÛNÛr<nÍŒ±·İX{ƒË.°5
:aß
Á7ª;Äí]í»¿äöG¿¸Ö¶ç3¼¸ëü˜6ˆ6Ë7&lùh4€U‰ˆÔäÛÑZÿ fğ;¯seÛŞOpûwîs7Ë_È›¶6ÛúFŸ—¤hcZ0ÂyX7]«Ä^´Ç¶Úrö·-ä,ó·™kqÈ7zÀºë·XK¥èÑ&é<®WnÈÜŞßòN·Ér·ÚËnİŞÛZgË±iKmZ¶55\\}D¹Ó1dKQåøŸâ7\')ÇÙ»ÆïòïYm¶Zxh!ÁÌ{Z\k…T–Æ†úkÁq7w»û×÷\—ròÇòä¾m[äş{íºÑÑvÓ `ùn6œP¶IòY÷ep›Ååmp7mÇí¹Úìì<¶ÕËÜi,ºã\ºÀå1›Ù­vëÕºë³Ü|C‹ÑÖ9î2Ûœ*qhÛp—ŒpÙÓZ¶ínEûîÉàw·eçì­íï4’¢îÔ³×ÿ £µ{¡uÚP
MGáÕ¯÷Ç
ŞæúeÜ\š^nì÷V˜QÚ>m²?ñ4N7¥Å—â½Ücø¥İ$ñü¿lŞ&Ñùv9¥£4~Øü­Ã|M«‹ÿ †=|³.]ãÔ	·ã$U¹ææ5:y >¨)¸¶dá%= ›T("xøÅgJ‰ª	”‚ T –3‘ë8¢m*P)JEG™ıç¸Üw.×¶¶;—[Úl¿´ı.Fü÷W\zÑ‚1:Úöñë;í}¦ï~}¶Úıÿ "ôµp¦¦Ù
ĞC‚Û¾©Û-›ãmñ{+»«AÚ,´òµ¸Í'@IÊ)«UÜ?vÆíui²ûÍ7î‡…ii'HœÔ¤g™Zî·Vİµ¿~å°/²ÛĞ¸ë ®‘P©wgnÌ§b9¸l¹uÇ\`ùzB[ÔÅ(Š$f%JqGWí®qÊò"Õ«`¹–Huí,/ÖéZ¶Ä›A*²Ã·¾Ó^¬W2íÏÍlCÚ-Úİ—ío[p“oZ˜iG‰N9Èİ¹™z?„å6Ü×°äöÌ­n-4¸²û^‡[•4¸ éıncâo­×k+ÁZ6ü—3ü’îİ¾É®Fn¶û7\—ÊúKJLŠJG«\MãÍÚcÙí?¥»]¶Ë²8û;®Ül¾mçmwımPXD´êÓXÏ/ÌÜf™€˜Fœ‚è
¤âpSP
t ˆ•^˜Xf:H =BŒDšqZÄ	¤ƒ ‰‚IsœQ ğºœª)—Q Ã–@Ë¬æ°ÏEZIÅCkˆ$Ÿ„¢ĞVqDƒ€šŸœó€xSFY@H9Yÿ ˜á(	‹€I’Ï$€©ó	$€B{D‹Ë”•—H©†3˜în·¾Xå÷¬ÛßºÕ³`+®8	(3¶óU×KZ7s}G½½Ù¿oÛ·h=Zû®Öæœ€slqÛ—=µâÇZâ[Ş7”ÜÚxµÇní2áq}ËVn9ÎRª¤)UrÇf
ßiò6¯¿ÿ §nŸ©úŞ÷Z¸Z¢J’—u’6¾åö…vûĞ ‚Æ›NhY¥LpÛ«sÑ6÷G¿kxš›—OŸápßFÓÁowÇ“Ùò'‹vç}³.e‹®g÷Âš­¨+¤ éø÷Û^Ï>úJèNæÛ»¼]¹Øî6.pÒ—š­ëêm#ÙõsŞaå¼~Ë¬'í9êæ‰8Påù@AÎ*½g÷@%©!ö÷@%‘S@ª«î€š 3^† P'Hš?K÷·ynşín8;çî_Êm
L¸]-@””o—\k]ôÛ=ßBî–¾íÂ‰	‚“Xò°…PËÎ”ŠHtÑüÒPhPªöˆQˆJÌ'ôˆI.	2
töÅÔ.ğãx«›~+s¶Üïv¶w»óM›ZíÆá»½wmm¬ë¸E¿šöÿ ùd
˜ãÉ}-3ÕÊş³w®Ó½·œjYùíØ¼?œî=ûv×­²Ë‘¶n2ãE]¢ÎšL¤sâÖæìï™&wéOrÏlíyÂ|ëöË,è
ÔsËî¹«@]éiÉ±ßXòò^­ø@Zœãni4À`‚4´L(8Ë8Š q¢
$E„ RND…A”¢àÒ¢D³¢Åe(³I«YÀ/HCU @$*)‰Ï …	ûvï-]Ù¼•¸c¬;T¥tqŒÒ8/üúÚWÚœ€ä¹åàÛ¹ã9-¶Óhı6ÿ mqÍ×nhoé¬KÃ½êí6™ÃtúGß\O}ö—!Èğ6ïZØíùŞBÎßk¸kpËWÍÃZE²àPİrcú]zWLå¸\·|_ciâú¡k½>D®Å\ù%Ü_P{#{Ûü‡nó›Î'·96ßÚrV¶®²û{aÂã×ä&Ù>•
®5Û2ÆvÚÌaÌ~‚¿¹6ÿ Q8›Ö¸­õËåß3ÛÚÛ¾Û¿i¹·®p5¿/K‹Úq‘éå“éz\½Éi·e–ï¹®}°n	i>`G	NªSOŒ–*"@Ô®ÿ Âr‹Ô@ „¦SŠÉéjı˜@="¨¸‚V**Ú	zÚHp)^°;»ß¸¯ÿ œæ7O¿ÿ ©¹¹Üİ*‹n^¸õBUXi®cèm¶®Ûï}·ÄZ±²{.î·e°^	s$IkY0úw9t›O/·}æşocböêØµ{j.9¬a ˜ĞMÀÙ’´Òië‡M._¼vÖöûfŞÛ››“è¸n©Á€-éB‡âE‰5Ë;\V-œîÛyÿ £¸Nİ,cJüÇ–KÚæÉC²Æ¥•Ğx¼ÒÎĞ—\½¿ùŸ8Zo¦Ë‹‡ÄòŠ 1zºkÑØ¾•ó›×,8§[ÚZß\¸òİã€y
	éo¥|!¬yùì“,7Ôn[·ÿ És77ßŞ±·ŞÛ^—›í~`(’õ®œvøÅŞËë‡nı4úmÊóÛöîîöõ¶ûs…]7w›«Öu\q-²×7UÇĞPLÇ~)oHòıÆ³Ê[ÙçŞÀµÌısú§ó;—}rÓy}×î»ƒ{±¶,›Ìr4mvÅ³·©ƒFºµ­ZÇ®Ïã6Ì¸éAv›=¦Ãk·ã¸û,Úì6v™·Úí­„e«€kŞ€Gà¸!:P
Ía€ˆÓ9„û{á€¸€ò‰\„0 ZqQ	ñ†(QË3!Ô}©4ÄàWÉ?"2læÔ‘€S@A+øÀæIQIıĞ•dÊ—LKíî‚8G!54$¨ªg€\:@H\q\§RY–SÂAçá”ÇX	¶éÎ`Tàµİ}ûÇv¥ÖìîZ¹¼ä^Ïš-4†²ÛL¸ê…ÈÆÛã¤tÓL¸Ÿuò;íæ'»İ¼o´¶Õ›{6?äÙ`ø@x©1Æ×i$˜Yl¸øc×aqÍ]s@"k2ê‘‹c‹*ıçÕëM%›Ækùe¶&D•q”gô§E_ú¿tvãQA["†E ıQsªÏîÉ¿SKœ]p¸—|vÀ#ÈJ±tlû]cEÛâÛ-Íl¯RĞ}±‹Ìfvï9áÖ·ÔIÎOŞÑ[³ZÏYä{ã’u¶^xt“HĞßzGO-«•×XÍl·}Ã±h±Éí­İ¶>¬5íjàB‚c®¼›kÒ¹m¦·¬g-^fæÓoÙ>‡(ê"=RË3{0d™Eæ#HDÔŸ2g*, J‚Šg j '³2·ááâWÒ¾Vç5ÿ İ^`†ğÛ^ÛvóKJî÷×AµwpÒïÑa¤´<VáA!“’m1oÒâ×°:C$ (à…*¸K¨0Q@'ŠÍD ¶¼*ÉPH­Õš”ôá€Â Ô )ÿ i¥+r¿¨¼C¶}çÛ×ÀïmYævW_¾å6Ì¹Ãßµ¥¶m\»òÚçÚÜ=Á–ìÜd‘ªB69o‡§ŠÛ1èä»øï«{­¶í³¹¹´ä¹ÑÄşÕúø¿—´ºe¶İé:…Fòİh}>#wÆ÷I´şÏWl¶{n;i·ã6`3i´¶Í¾Ü5SE°€Îs¬XãUÚàLÂ8ÉröÁuÌB gJ¬PšãAí$àHÔ“‡NŸ´ÊdR"¢¥:ŸÃ¬P”‘¤\”‚)ê)šááHÎÈ˜TÓ(Š ‰!>‹™ˆÖz0ß°â÷ı±Ìí9}•½ï¹ÛòvÛn»Öšç´¼ êázu]{¼ùİŸS>”ÿ {Ã}ÂvNÉÜ÷kò»voù¯	ÈÛ{¶[ß–l:ÛCÀcZı ÉKnF®ş3«i?S·=³ô³oŞmì½ï%eÛ¦í™ÄnùîM»+Í&ÓŞ6Ö_ézœ&cË¯»øôw¹Æ\‡ê‡~òüåŸşËÁ³Úü®îÿ È²şï˜»¿¹d^`¿`lÒënÓ¥}#Ò‘ìãâš~¼¸ïÉv¸zwé×fò\Ãï{Íö÷]ûÇñÖøkÛÍ­÷İÙ³g¶–Å†°5Î·¤\$€)(ÍÆz3šŞÁôÑHT9‡ˆˆ”PÌÖ€Eg*d„’¦J"¡©ÚLPEÆtkC¥©HËï£51âè  2?Ò<üŒú/Îı=ç¯÷§ã¿úÌï·—sÇîojsv×Áa:¾MÁQétÄúkf0ë6¶¸3/îv÷,½övÏ%Ï´N±ëøˆ!
GL¤Ì¿{<Ş÷jæ¼nï8éù`=GUÅR3¶¹u×“ÇÕGÉî÷Ï´÷î/:å‘¥…óBº¥)C]dg}î×¸µ½¾Õ/İ^¶æJÛØÆén:\Ü‰œ.³Ù©µ÷­›ŒîşFØ6ÛjëšĞ®‹¡¯ 5 H-#Ë¿ÅìãæôÂû‡ïçã·7/mîn_tEöpéxõiëi1Òà×¯y–w‘ïNgyÇï>nÖá³ºk(ıÉcÚëv½opz‡4ªÇ—Yú»÷zvÄ×>=š¾Úë~£r»&íö;Şc’ÚXı¾×‹âí=×>Pr_-®E'ârúšixæ3nM9®}Íş;ıå»5—;£ºxæğÛû–Í®×ó/m[p%İÆíáA¿pzÀ¶ÕÄÇ;råÉ¼³ßPe‰œòˆäDÃğ‰¦Z
¡PA$&S U`"?š@¨–ê2Yà!J8 ˜O¾
Z\L•2•!–ğ5Â 	û|¢`„\±IA(ĞCQ¡A§ŒT“*Ô+DˆĞŠã5û$ Ì")'¥ &®¬Åzşpn[˜ÖĞ(&Ês§¾~ªrœ73¸àølpÛmû!ïuÔõ ² *á¾÷=õã˜Ís]Şï{Ü;››ÍëíİÓıÛ÷œ~aÉ\¡PI#œte8îÒ’ß‘qûcK‰qËî4Á"Z3lì~æö¼ÍËm––µ÷ˆ0R‘œÏe–$îÃï:ßr:cB¹×$¸®}!™ì]§²Úçj÷·=¿÷Ä õ:äÎ*)X®Öî‚àû¼¸%¨öºüú!)Y]·n÷Pÿ œsVHß˜QYˆÅk,•¾ßæ™ê»Şe­'TS¯”]ìøî}±Ë<M$û‰«6ÆË¶í>èŞ w<Àk‡ºãÂšÚÅÚ/­öÿ ppm7­ò€4•¸Ö4S×’
FäÛV./£#°æI}Ë¥Ëv®[õ3pH´ÇAR€ˆôiÉî;éÌ€Şìı=İ‚†IvÙ'ÿ Š;f9âª6ı‡’ûjBóS­a˜˜©Ç…kš|èˆUb‰i~ªVyıĞgõíöÛ]Ş?gÆí-²ÎÓknæÒÕ›;kcKÆ‹ˆĞ=ñäÍ{<%ïWcê6ñıçâšı¹ûŸ-SoÔMÅ{!dãvÈc-pò©ôâ¯ıñË]iÿ Ôq`’ ‹Ìx3ëHySéÅ;ÛÎİ9-˜i]?%öAé‰”O*¾ÙOüï<êòöP&–ÌšÎq<©á=‘÷>‰şfÑ$Ô]` PÒ/•<g³ÍÛîmõ®RçÜ8¾S’Ú;e{~ç|ömºÕ·†8€Æ¹Ái0—¯Väè»í«¼¯jvïÛ<NûmgŠâ¶¶¶{PËºK˜Áêy !sœI'3½·,xOfLs½À¥ÖùkO} Kòji=•ÜÂVÕÂê˜å/ŠøOcÿ ?Ü)ÿ ñV(À¸)Ê/—Å<'±àçñåm‚¥¸Ú¢¥3†jøÏbÿ =ÜÍåšˆëlÉò‹äxÏdÏqwîI“S'·ÁˆyTğÄ{ƒ¸õK’µ#0.4I$O*xOe#ÜÄZàŞRĞvZ˜ÔN„J5’i=ˆ÷?pÑşJĞ="ë2ğ†O‘îNá.—%n€‚lÒDÒ3åñO	ìƒ»›¸H%œ³qQ5ÚQ•E!åI¬S=ÍÜ¥¿äZu(zÜ²AiXyVü"Úß/ÈY³sknŞÎÎŞë]jëlØÙEÖ–ºAdL2¨ñåõĞá»soÂğop¬Ûí[Ê\ßşërÎÄ¹–îÚ·hµŒ{­ pAQÒë§|Ü³3İ9ŞËá{³º­w¿p0ï{‡onÅ†î_ºm»NfİM°ûl!¤…31&öL7tğŞÜüú¸?•f£0—m¥K¤g4ñÊ­îNlµÊÛP–Œ
(OœÓÆ{*åå”ò–×î1	3”©)á=€î~RŸå-’“1ˆz•Éá=…¾æäÄÇ&Ä)q˜Òi5sSÂ{#ÿ uòì2äØ4 rÜi™ÄJ±3WÂ{"{·—FòL.i˜ÖÀçĞÃ4ğÊï>m®	¿ÖÓ_ï0x$½‘|¯ºxjÀ÷3»»c”ís^ç‰ål›wC/ÚkÚC­]bÕÌ{Zùu|«Zë%Ìy/‘úOßÛPOìlnƒ?UÍ§5Ãá.GÂ=íµ‹¹ôÓ¾F®æ§•ËEj ¡ùF±JÏÓ¾÷v–ƒ¼^AÒí‡ïÔºŠ¦Q.Ñdª¶~Ÿw¨ùmw
ò	sÃ­¸´*V–Ïu—½¾ÇîkW.Ú·Ç]¼peæ›m¶àÙ5Äj##Íf^y5‹»Ÿİ®¸öÍ/!¤üë,`P¥=R2{q_vç<Œ•®Àî.Clv·İc‰°ò-ßÔön5Ûºuê5¬4ãÆÙ©¿<ºâ;¿ÓsÀ}8ãïíûyŸ¶ŞnØÃËòÎÜÛé´Ôis˜ Ø¤2Ûd=ñÖİ«Çu—»wg¹Æ\³‚n;‰ûŒcõ|YğÕTwª·Qç-µ®™pÒtõa™ºÂw{ÙĞ¯îi]NÜ4)Y %d!“¢?÷ŞÖCşà²A3'rÔÕÿ š5-_O}lqwqØASû¦%)ñNÓÄ}q`îM¸Äƒºkf$Ÿº3¾+ãõ„f]Ï´Êvé¢†ª.6ø³ÑHıCíÆÿ ûNÑ¤à7m(i?T<vö¦"ú‰ÚÀ…î½˜ îÚÿ ˆÅÆŞÕz(¿ê/i0’îïÙ5Í!¤~è:!Ô°šmíSşãöSƒ\{¿c¦r;’uyF¼6ö¨ú•ØúÛ±huo—*Ìô‹á·µLÅõC°-ú¿îıˆ?	óÈDÄ¤>şÔÌ÷QwÕ?¦ì-k»Çd\I ¯u'$mKjSİNçÕ¯¦¬·{¿f ¬î¨DÓœ_¥¿µ<§¼ZÜú½ôÙ÷†ÙÃı¿.ér®(È}ı©å¯º“¾³ı7ø‡t°ºhÆíî™´Ì•d_£¿±å¯»CßwGa]İİŞXú•}§rótÚ¹Ä·rZâUĞÂ1¿£·ü?ÊıIî§ÿ vÍ„#¿­\Ğd¼ÈtÑ%q¾Ñ¡·üÊ}IîÈñÿ Y8>2ãSºv»†…¶şwlTz›}d‘›öÛ_Oò¿S_vrßò[†°Á§}³½mÁC¿ÇoÛ¤ƒ?şq?i¿²^M}ÅÏä÷\óbäˆA±Ş€gÖê¤j}ÿ Õgêh³»ü•à^B´ Gì÷"_î×bşÏê¯ÕÑLÿ %8@ºXç9®fÒûqëw8~ÏtúúÅfÿ '¸{mkmì¯<“¦[w0jÎweı–şëû>)å/
mãw7[ıÇ²Ö
É¹CØïï÷:¥gùKÀ[snƒİ¸ÌSXºåŸc·¼?q­÷l;æwbĞhí[ä±Zód0RLkö|“ÖWO\£ù·½¨Ò¸ZÑ¢WXT¸H N#_´Ş÷±Ÿ­¤í+{ùK³Ü;KûgtöP¶/Xh ™´’‹>ËoxŸ¸×Ú¨?ù;±@[Ù—¢.ÜÚ‘ÏÓn¯ÙßxŸ¸ÕNçò{h®#²Ú\]º`%§¨d?e}ÿ Â}yíPwòi‹¥½™d`ï2ÌJ5û/ş_á?q=ªşæ÷EËc³öìz”.ß^¡Q!IV³ÿ ä}ƒÉ6Kgl9“’W¯”{²ó‡zt|ZhŠõ‚¡>COé’8*BJ€´"b3‚Ê¸äô¹à'‡g5¬gyT›zã€&õÀ\
‘qâ”B°ÂùSıÅù“~èI4‹¯ı?ø¡ˆWÜîõ=;›úäçÜõe=XCÍK÷»°»­Ãg¨8ßºEaˆ™©G|éßnZ @Ñzè<°ÄöO+î©şO”- òªŸ‡qtW$rCÆ{/•÷LòÜ– [Énh:û‹Ô?ø©ŒOíÊû¥şW•k‹#»'ËÓ¹ºŠfLœY¬öO+înæ¹°Ç¯)¼r*n.€½}F]}¢ùíïLó|ÀqwùMè¸É“û‹¨TÕ”O}¢ùíî‘æ¹¿„ò»×7W‰*jº¥Ã_h{{Ô¿ÍózƒnòûâãW~æâ®ª'†¾Ñ|ö÷/óÜÙ–ßÔ7(¸Î:û5å}ÓÁÎPå7­ h×û‹¥)«Ê/†¾ĞòÛİ&÷qÙ-oùëKJ~áôJıñŸ}¢yíî“;‡¸¯¶óæ?¸¸¤×ıİaá¯³~wÜ¿î.äô¸rûçbóû‹€!Ä£½ğğ×Ú'ŞéãçĞòûÍD¯î.‚µQ35‡Ó×ØóÛÜäç½DrûÜœó~èøªO©aá¯´_=½Òÿ ¸ùãÿ ùméW ÂİÃÀFù ¤_ìyßz—ıÁÏ‘¥ü¾ì4”?ú‹ˆ4Ì/ªB'¾Ç•÷I¼÷>òO1½sRÅÕÔMfat×Ú5å·º ç¹×&®[zh.Ü\ø”“CR)ğ×Ú{{Ô]Îs*y=æ™•;‹ˆ”ŸUaã=;î—ù®hÓËïE¶F­ÅÄ+5BìiÂ{/÷Cü¿.Kv qvdQ}IIEñŒæòÜ¸pwùåÖT-û€|]…‰ã=–Z™ä¹«ºÒN¢>}ÅBTƒ9DÄök$íÿ  âÒíöåÀ¸€~uÅ:Bàïõ‡ŒLĞ7{àİ_¾Ü8=BõÁ3#W`+¬Ô›¼Ü<0İùÑÌ½p YN™Ãä¤w;‚Ivãpá2ò.Ü Š¬²‹†nÄÛ÷î—®™ùT2”ÆPÄYµI×î¤^ºHn=ÃÆµœ<bùSuÇ¹À¼¹ê!Ïr”‘
¾ø˜O$4µ·Fé·nüÒ=Vš÷|¤‘©e1ˆú¦÷ZÒÀö—.”xY¥gÖ5´õXºX A$€qËúEg*MM
)iLš&pB¬5†£¦â2
qÈËNj¹ U WA™ñ‚!ò¬ü?*ß¨
Ÿf”ÄEeP[Û”wÊ¶M=(LFrŠCsvà¡k¤éÕ¤™§İ©Z ’ËzÜZZ —œ§Šˆ6XÒZ@Q'èwM§R•".ZH›FA4p*¹çXeoXv’KT‚52`
@ı·4Í«0Ğ“Ök¸´Iùd+š¡ê%Ç%‘1YÈ˜ç›"AQPcA8€ná„‚[úA ("‹**#s0u]m‰7À”‚æZÎŸ÷yøK¤/œ×55hg×Â”œ÷úAkˆrSJÿ IF¢d¾p	Y,
’±R˜çiMEÃõiRRtH3’vä5¨†dÀ1ñ‚|’òC—ÒâÒQIR&ÎâØõ¸´¦Ğ²è~ÿ Ñlî[uş†ë`(â¥U$Üß¨®._kM³ó]UFxb*eïÇ¸İsÖ×=¥Ç@"&UwóñêTZZé&DTT7\å'Õp£K%=‹2?(
¢İçÜäİ:‘\ò¥LÓN‘EFlù8|­–à·TÀ±wRÌKĞ‚‘XqœËÍÇ7t÷ÿ K¸/CÔ0ƒÕb,skAp Š…UÆq–Ÿ³¼‡w[¿qÜö×`ë{}¶ä´m®] ï.XøA™[rÍZñd{øÕ»í¾ßå»†çtíw8½¥íë¬7kvÛ®7nİE —”Ôd	‰9å¸Âø¼ÿ şE…p´A> 5L$wË–]ªçĞNJÏÓÍÇÔmÇ=´ı¥…ÎUÜgÈ¼oZ?ôÅÍZTœQ#åXtš¸í½Ó/:İ†[:¯=–ÚâåG\ph>KX•è—ñW¹÷û=¾ú×rqvÆáâÃ­nu"‘3â&‘ç¼ú»xUÀş$÷†©w7éªü­Ğ™ª”‰û~'…Sÿ ÚWy´’{“‰)‰·º˜ê~ã_‰ôêø›ß ‰-3!ÃrßF˜~ã_‰8ªgø—ßbœ÷„Ì»÷’Ó8~ã_Šı:§ÿ ´¨ <ßHÍû€BTü=bşã_‹?Nş%ıBi-Ç0T—Ä¢¸Óâ}:_ûNúˆKš9n_îß‘éı¸Ÿ¸×âÔã¤ÿ âgÔ–¹ÉğÀ“êıì+/—?(³î4ø§ÒØâÔ€—ëU n/
QİV¸Óâ}:GøŸõ,.äxpæŸŒn.êJMmÔDúúŸN™ş)}L÷‡q¤nn…>v¡õõ_
?ö§õ5U›Ş ­$nn©$MVÜáõô_üQú–N“¾áå5ıÍÙœ“åÃ÷J§ÿ µ?©£Ò7¼C)wî®4ÿ ô¥¯£^¿ö¥õ,„ıÏ€*şéå|¾T>¾Œ]-ToñOêP-wîø€Ãÿ ÷/(sÿ ¥÷/…&ÿ ¾¦´w|A¸d?õOO"-å÷/»ø«õ-®p¾$Òöîî›ÿ Kß÷/…Hÿ >¤•aŞq ™ İ\’aÿ H™Äúú&?ŠŸR£÷œQ!
şîá
0ÿ ¥Ö_EñTÅO¨äéÎ!¬q ·÷7L²O•÷|O
©ÿ ´ï¨¦äx•$¸½¦x‘òÒQ?q©ôêûLú†_.W†hDÜ¼â ¶áû>'‚³‰P\Aÿ 1Ä¤»…ÕĞü¼aûZñUoñ#¿ÑÁÜ×XL’æåµÏÑ¯«8I¿Ä~ûQ¯Ÿâ} KVä©ÃôRI8}mL$Ïâ7{€C»ƒˆ‘ÿ ëD’:é‹õµOñ¼5ãâ]ñ;³<M=Ñ>¶¢_ûEï’]İ\¾·ºr)­¨üFî
÷W$t´Yİ zıŒkêê™yÓ—½ş–ßp×m×¸Ë÷6÷o6ã¾]ÇZ)¨0±Ök–nØ¸vo¦@y?ªµï]Ÿ?µã,_Üîv£a~Åë×Zı£Ã	/c€G¯”rÛ’kpŞrÜÇğÿ ”*İÛ&©?ÏpédàÆ1õ§±ŸÄÙG\îİ£ÚP;;ÁMşå:CëObÆ¿?»®Åí>CºlwYû?’ÏÙ;msn.×C	×­Àá8Ş¼²Ü3‡µ{vC6ûg\šüÂò	mAI„z0åšêÿ F~‘Úú²y¶oySÁîxvíî7öÖFé—mnu5¿šAa¬£ûxºkÕÕ‡ñ—Íï+îĞÇÚˆ£û’[àÖñ…wyoÈ
›  ñtºÃë|	â×«û¿~Túš6[d—‹¢ı‚xªíµİ/û·‘$!´ÚŠ—á¯ğ_oı¥öˆBşæäÜøE ò

Dú÷Ù¯oñ+³BkîNVãd­6v­^²l>½ögÅUŸÄşÆ ‡sÜ½Ğ’	¶İé¬>½ö<?ö©ôù­OóÁ'õíõÑ?éEú÷ØñOÿ j¿N“Ès$!¥ë-3ê-åŒO¯}“Å6¾™3Pvë—qQ!¹¶Ùb^û/Š_ûcú\ÂKnráÄ~è˜9—¯±â˜ş4ı+.6ùRÿ Öïò’Cô}Ğúû|Â$?J +·äN²]¬òæ$!õöø1[ÿ o?I˜'Æï^ÅÈ^’Ö‘>¾ß¼bGøıô™º¿úNåÎi ¾¾B
ş¡„>¾ÇŠCè?Òqÿ òûœA_¼Ü/_¶3y÷_¬ß¡ŸIÿ òÛ§ã}ıÂ©ÏÖ"}mıÏ¼·ôGé WjíÜˆ}İÃ©0'r„>¶şéã}úB×ÎØ8L‘t’´_îg«¿ºxÅÍ¯£_IlŸOeñEé%²â«Q7¿Wtğ‹›I¾–1£åöW¤İPQ&L>®şéã–ş™}5·éggq  ~ÒŞ™+êmî1¶ìÀ·ğv§ªˆ6V	_6ÃêmïOâ?ËNÖàxŞÒíMÿ ÃìøÇÿ •Üm77v[k{rlİÚ— ı
55@v1Û‹koZ–L<Â÷mt<«î1Ì—¡\he2#×ŸMûmÃr=Úœâ¶~ëˆØÜ}ÏÚX'WÈk]2Å%F1óv·5ÚHÙÙ²ã˜·°Ú F[!r£#9­a]–vÍÿ §¶°KM›b~M†EFéF4}Â±QP]¸
H	!ûÀ‹¥¤uIu‚¾6ß_‘tŸƒå¼¥J§İEÅíß¥­6[Ë´‚Ë\u†¥};VÊ<<¾Ñuõ^û­}3îëá£üNä%T¹¡¾ÙÆ4ù¢ÙÑà].F·	íÃÂ>‹Æö¯qŞ;oã‡ İaOoèA_]Öµ'„ãÇÖôú<uÅ´¿–ãÛ‰Şm‚b†ó£Õ·g{¾ğw á¸òªÁiZG¨“¨Ôˆù•íe­Ü”¤â¡2N¢2¨›Ë0å‘lÖAd‹„›pÓâ˜¬ĞA›t8dg2=Ap•Ê®¢¢DQ<>Ë&=@-Px§„(¡TĞÒ#PkAéD$«qQ­I•ò3€hZ"
*EÁ‚@n©8‰É|¡”ÀÖã1?öÒY Æ„ƒÁ3$&ãæ|b¸QK@3>È"LyÒHr4ŸPP%_(4ŸÌU"‚AùA(kÃ$fß†R­WÌDHEæ‚aÒ	§ôƒH¶á €Š
Õ°Š¤/€¡(d=ñ*`ÿ p€'Ä>ü¨Œ®ZíS'R  È¦^0Um›[ĞÊB… •U¤”OWCH¬ÕmJ	iPjü£L#N£5xÀ9–€îª%TÎ(‹Â‡lQ½º±C2)/X
-{‹Ò®tä‘¦kæo}[wıíÜ’,'‘Ü¿ÒFôµí¶ï^Îş(Ük¾‹lÀ3o-Ê‚( ù¶Êf±âæù5ìíšĞi.*³4’t¢T T×îó€Ğş´séwp5BÑ·r¤Æ‹ì%tã¿ª%xÈ	kJ çè
Qpå€éIçÃÒÄ+…¼Çy´’í†ÅØ‘ÿ ^à58¬y¹ûG]cÔÁÊÖd”2§\cÊÑ—dêä(qñ‚¯Ò•H‰“
sp[%øISí‚h5
g‰Ä¯ÄåYä „u™¨iX”2¨!˜3$ùKl2"÷:kAS‘È¤03QE¤")—(pÄMA‘ åŠˆ8¹¤—L‚Bù*Ïï’éç CÉ™ÄÂ
º‚—0ÀeH5
dj—©Cì#4JÓ\®sÌÁãá8‚îÉR•M2_8¨¾´Ç#Aãñ RDa"àµÉêYÕ@û¢¥¤ĞƒJÈ”‚ä#L›Š´4”˜íH
ÖJ5QãÇ¿–sé>ßvÆ‡§3²s±•æÜ·øÇn™/gˆö ü£hĞ÷†¶¨ï±ïr£B·C}ôg±®—k6ø»vAıV.\aû£çrôŞ»k::+H‘8M(~Æ95„šHYf¦+&”¢`OÛ°HIÒ²€	”½±GÆû„:ËÃAp!EÆ’¢ã+Ü?N½¹×¥7{v¸*FÙ¡*cÁËèï¿X.‹_K{»K€'¸Ôªê¸Á?™og‰›Äï¿ÅÙçËş)ûïñ¢æ¶›ƒrÆ6ñoËVPäBeì¼“_W¬»öãößÇ}ÓA]|NÖÑPŸõ7,)ìœy§Îï^bâ8‚×öç0İæÚàŞóÙşÁ—{eûk–®í²ˆËÿ Ûp”ˆE®Z÷}â\Æì\»ööæéz´¬Çá6÷zã"Âí$©È)*ã”eQuÁ¨4¸¤õA€Œ¯¢Mxh 	ü*ìÒJEËI™ 	¢J  ùª|„L¾c®D&1I×êÒé,ÁÂS'Æ2°j*…£P(ä(	üL‰P
 –¨ĞÈ:¤4ı©sœPÑT8¢Ó.±CzF©ÊTIc(’ğÕƒÓÊ4É©—LÕ¨UÓ3q	6àdšŸzÄ\¤’(ÄAF´%®UPJ N{”¸•©.ŸÙbŠ"ãZâp À1ÆNU%S?ÊÀ/şÆÔÕçUäqi›S	™€¯iâc ƒH–?IşØ‘@ —º®ğƒÒ¥S(Ó à $ŠLX€Hh
f‰•b¦IÅ·€š/åS¸Zª³™h4_<âÁNÉ=€KKÀpU+‚Eeó[¿XYß]ÊÕ/wùólå)GÓÓ´q½Ş½ş'\k¾Úe9®H4Ú)qâæùuìîN{äâ€šıÄˆàØüY™¯O™_ÖßşØ÷3Œ´m­¼¸'Óy†dV:qüÑ/g€^sÚÖ€m¾ãZLÜ}dÖ>›”zø‹y{£»­!ÓsŠÙ£ı»·LÊÇ›Ÿ´nW«ÚEÆx„ZûcÆ£SCuQ&EHTœ§ËİD–‡f@RMeĞB"*„‚Úû"Õ†¤Á),Ò|ZÊ’U+çbn§@èÈƒËœd„` ˜AøÀS/+DkBâkOtTS#âRšHB$b¢	0X+CYR:5 3R'@1ŠÂ}³¤@‰œœi€ƒPÍ ® LÁ‘+÷Æj¦ÛH–óŒ Í^Yb•  4¤ÀÆñŒ2.Na>ñ"¸*fO¿Ûš…I úWøˆ¨E„úTf Š*Y©$×‚çÎ¿’S»ú+Ï‚]¶Üqû¤j(ù[†…œÅx¾x^ÕàÆİ—İ¸Û¹Î´mî…Æ¾Ñ˜@¨¥§Tãè<ï ÿ ÅıéŞ}íôÿ ö]Ï!´ÿ kmn\@ŸGGƒŸç®ú^ÂĞ¨‹XàÚ@¤ÍVKDéÃ)*˜@HÈ•À…ñŠt•¦~iñÖÃsubÑ¥Ë¶­ù¹á¨¾qô\ÙìTnÇšx/%xU!Ã	G‡~ñŞta¾¶=ÍúWÜáÄ•ÚÛf¥š›öÉxû¥xºÈ]Å£ EË`…@}c(ö¼ÑëOª··úû$“ó6Üe¦ƒCªû	û£Ë§Îí·g˜{ZÖ¾éáC¾#½²¤Uå—EéÛ³½ãèOğ6GŸú{“!;m	.½’²Eïkf\H$J^DU'?ÖïIõz{¢aS hPCDŠN“B!rÃëVÙ
†’¢¥""°.Ò~ãO÷A©¯ˆ,‰¢õšÊ"¤\ç4 Sˆ òñƒ9IÓR)d1‚‘˜2¨™ië+Y‚A5ÔÚ"ÈER>’ ÒµÂ¢¡3Ö+9I²›AS #ÊáÔE°`ŸtBÔƒµÁÄ‡U§ÄÄC¡ÂZU\2Î°,º
À@€	•ûê½ •@»×)‰ãç„¬,"U˜Ìş1–¡jG8 ˆÔ)1L\jµ€•b*âİÒ
„-’EGH¨¯d©ÒReBR««¡qº	%¤I‘ŒÓª 3I¢æ#LS=>™€S¡FœêŠ“ğ’$(>éBıFºqˆ©mŞ~Ò€A{@(¢QQó{ê #¿û™®n§7ºĞODˆ†>£Ï·zõ‡ñ*æ¿¤»–aoœŞ†™öØrøÇ‹Ÿævãìïr€˜×ò;aT)2Ã©ˆ­Cê°_¦=×úÛû@2¥Æé§Íö|ıİÍà†İ¹©d~" CÒ>œyİûø•uÍï^ã¶ã;¼5µ‚İÓIR•+9şXŞ¯[… 5Ø~’h‘ât “¨•IÎtiÒ}Hh¯IgE²&h†në\bà 44\pŠMTz˜.QDJLM0Z$
‰s‰‚( àß< ™"A!Å¨%¦}Ñ0 ê“IúpC…b¢PA8 %0HĞ¾¿Ò))gì€‘d¾.é@ğ€4$eÕÕ(ùh&?´|¦ °ÛlÍ|ÎGÂ3UYUBšBu]±‚h5$€2\×4ƒ+›CKB ¨LúÅ‚e@4„QùEJ£5’áÖ+'ˆ æ±D­( ™ÊköÂTúÕµ;ÿ £ía¡^Ş1×€I‡X¹nâû£§ÏÎİË^7·í¹™¥Æmps^‘ô{İî/áşíÛ¤›™%v<ŞöÔñmæZ»÷˜ğıÄı_“®õ¤š8¬ücÎÚMY¡ÂfQE@Ai ÕëNT&XtH¨ğÑ*½ >?ğìmŞkŠ²>›í  U¾ÀG°ÇĞ®1í^ÃAÂïî.¦Üå7¤Ôqh‰.NîÍOë»Ë>–sà7ã;[n5*w,(2üc\_3;vx÷o§÷v1?1CPcÍ;½Uõ¡ÿ 'è•‹@)uÎ%¢j“ÔrG›O™ŞöyÇ²™¯»ø6¹¡Ã÷mV”C¥®${£¾ı˜×»ßûm¶*H-0˜¶ßwŒ|×©¶ím:¢•"iO1X§©£Œ‚“¨7:ÁreÏa@E PûÖêÓÕ…Š“‘ZJGÂ&ÃHÿ h8P&R#Y9´ £K…D§‡”Fr˜C" =T"€#ˆ"NZÑ—¾@-Òƒ0~ÔŒ¶mûñ©\å›CH(4ĞQq4òdƒ@‘‘E>$¢,UÂ`!rÔÉÕ#î5-R
NGÂXÅaP M2*‹OË¤xiÖÒff $ $ÏU?
D5 :KD*
,ÖƒÃOÄT%ÂhYg"êŠ1TÒ^”ŠzÊ©*É DŒúÅiQiˆŠŠL¤p•AVÛ›é jÒ3ƒ*¬q&`fÙÌ$*Z¹cÜ’Ui ’+¤Ì
‘ÔtD§nã”3 qéeNåĞÄŸ¦arH
7/à²@œ1X¾è~âØ'Ñ­¥Î$,¢²ùáõ(õ¸ÚÉß^ ‰¨’ÇÓãùcÏ¿w¨?ˆ÷Wé—,Ê–ó›„''X°O¿ñıÇÍù;qöwö\QMSùÇ™Ñ&»P!Ê£ª?¤¬}M3éÏv1àÿ ü6ép¤ÚZpğéŞ#çÆñıÂ´…ºìB¢ª€0§jîÄç‘õš`º¸W«°ôn-ûcÜ|¿›z=„ƒEäŠ‡¦<.Æ55!ËÃ>†4…¹`g*ùÀ"ÅSæM`!«ï˜üX ª¤H¹>È"¡4P³ •e$ €¦êiW¡NrÎ½&@ÇÊ
Š 	ñ‚hv&TEI †Ö…ôüJ&é'õ]LÀZ`&Õ.qS?Rg<sH%Â‚"˜¶fÔT„œE;l †4H"­õ•İ±4S1†} ‹ ¨23’!‹ÜfQ2	ı"¦œ&*”Æ‘RÀ…²Y”^²ë¶]¬H)5yVß{OßövìAvã‡ß (	ÿ ÿ v5­ëw|Ñ¼ÿ ›|] é}‹nOÖ©4¦ó×²?…[×]ìşòØ:coÌmo5r½³BlÜwšvzmªTuñ3i…-(2Ï	âˆ©ŒQ%*©&­hr'Â(gSM'íXİ­l\îÙ˜¹ÈìÛYJûIIBöqeö2Úä±Væû{qÏ—ê¾J’G‹“æv‘¤ÿ  ÁôÇ”h÷nöLœ—Uõ”Ñ
F¸»³¿g’¶–×{µÔ=&ã7ÄN=<^Ÿúñ{åı&ØXÕé¹ºã a¡¶œSİ};»làŠÎóá—ÿ ÖT¬)ñ×•ÏNï|XZ²-·Â€>QóÅõ³'èv%&I8~pL \“DB™£|b	© \¢J BSı"4¸¶Pµ	L(ä¯*$dsÇÙ‰„n$‚¨AÍPCAÁÈæ‘3-ERH±p ™…ršû}Y`ª €Ë³Œ5(RPª8 ã, €:A+R¹
Š:RJ1›§‡º#I´ÉDÀ@sO,Œ
m$ QÔMV¤A”µşÓ€Be‰ğˆÒL(ò²_‰F0 $“2hIlIå¥À¤Ö ¥"Šd“#ZË%÷ÆEês•À2Ê ¦À*µøJbª³ Òr'RÑS¦Q‘0ZºRE
k‚ˆ"³@A¦Dç"³]éN(¦‰ˆ1¦OQ•VºiJĞ,T£æÏP©PÈçÒQ¤Q»r¥è
!#e~ëA*I%Sâg<"m®»÷VÜLµ¨èh†4•àO©¨Ï¨=Ä×Iw—HAKŒÇÒÓå÷zGø‘|ÿ öûŸb’-ó„¥@/ÚY2öG“î>iø:ñöz·€^y·?lyU›yI©O‹àD¿/vt0™?ŒÜÎ†LTÊ±½>hÛÀFöş£¤¥$„,è#êÇšÎ®ÛüP¼mıNŞÛq]\.íºS+¶]$ÿ /æé£ÙAÚH"bjÂ§íã?.¦P(˜•jA†BR@Ò.@â¤‚ d:aNzÉP0¦u€oI/\	‹”ÂZL€Jù•€	©ó¦ra-j§¥á¢}¤>/³€sJL™9Ef?í¨'/"bÚp¡#@MÃ^Ÿ|D£$s‚ÃÒìLåS¶&[ å¢ô‚+ÛVš¤½ã#]®ıA ¢$¥Ò,D¦ƒ‰ÏCÚ 5jËı`ğ ’*¢Á*,	pk(@À¤º&qQ[uc÷|g#µDæÊ¢ÿ Ô°öĞøÅ+åÖö×É;v=ZæXÒŠ NJåĞÇÖqÙêá6óÿ Qß|dÁ6xíØŸõ.Ù"<ŸqèÖ‘ëv	©9“ò#¦Dé„à‰L(™©TÍ $$P`eáHˆéE'(£äaÛ{Û·˜J“¾µ«¨a.
O„}»8Îï_vF¶öæúEÃ}áf}W8¬xwù\ûù	pŸ§·ÚHWoö!k ÷ÇN.î|/l[ÿ ¯Ú´şc~ùe§wz?ù}ƒéß·ks÷ÛM
HÑµq%0?w]û8ÓÆ‡wÇ€Ë¯qkJªZvrÆ;íÙË^ïyYÒÑ¥Q¤Lƒ¯²>kÛ¶N¦‰©ÒOÎ-x/s‚,É
LeU´µÎ§©J´%|‡œdWaRj¤Èš¥Mb
À($„*špTŠ&2&m ¨LÈ÷@"­(jå9iVÉ«@Bœ4q3* €É *
¸©3iÿ …"7ƒzÌ‰¸jÇ(¨€
5¢¢@#J	ŠgB¹”-®qXÂ`€âJ©C 	AÓ–®µŒ·¢u9&â å%”q "ãÓ?89ÄÉ%'N^“Ô»ıÙ—Hõÿ XÍİ­Ú‰iYbü|à©µáÏB¢D²”‘"
 µ&|W¦
`&1¨i(…iìbaT8i(ññ%"T†‰5¨ e1L\PV¥µ)n=åÒB'/ú@Y_x›J‚àSLğœ¡¾Õäîrµ¥È
!Pˆ©XÛ5á?ªê7q†§wp¦1ôtùcÏµêôñ.é™İÊ9Ìæl’hĞ³j'²<qóG^>ÏB5áàUg.•(#Êìz‘¨#”É	sHGx¥ŞÌî&9ºÁã7R
²¶ã×¼'wÏá.ŞßyøÍÙ„ !hYt«/waş.\6¾¬é 9—8nE1AiÔè“<ÿ #Zw{5·Z=(U¦asœê«ó¨]"Aµ>qDšâªGL­"	0€â¿Fd˜¡>"*À4$9&£,ëWÔd$”.Qš¥U>ø¢RøRR'Ã—+œ¡Q€ğñ2Ì¾&Š… ‚bŸŸ¦¥~èI­_0Tö@ÀQÀi$*à•‚	€†mI7Ç(5‚Ğ¤Ï:ë 
F"£	ÀT¶•Æ«îPEfN´=€š)*{#H‰('„ñŠ–€J(
ƒMg” A¹?ˆR~ûóoÛa*×¸2í|¢—]Ñ`í9}ŞÔµÍ67›İ¸ÿ hÑ}Â˜Ò>¤®wwïánù¬úÜÛ÷|qWm·MqŸ@øá÷ôÆøïWµ¢Ètµ6¹P$(S•F¹§¨'ŒPÁò#%ë?‹?9@|™únï® “&în\BVM±uÊ=ûvqÕëÔ¹r×hq-y!ß#Wª_‰\ç-¾jôÇ6şC^#²-0ŞGl\¢dµ¯*¾QÛŠusäìóoßmfŸŞe|zÇ©çzù¹k»O·¬€5~ü+¨ïNĞû”×òñwvß³}8Òîõâƒ¥êq‘OP öÇmû9éİî6nÉ¼òâc´‘Bpë;Td,nÿ ·¡}unhJ’ƒ(¢³n®ÒÖÚiOQÄ”ˆ«Ö5¢Ò’CÃš0R“ŒŠ¾¥!IP¥´ë†y@1'‚	9å‡Œ_I@TjR.  @qrŸ8.#PD
İ×îˆ¸D<êPVd¨3êHÊàÚ@-RåTD”ÖqTÉ’ÉW:‘ĞÄ7áÔéZöë ò$Wàpü`©5@R‚U UU—€€–©i¤œ*‹ø¬Ø%¥
T&¾) 5(«#_(‚3SBU}3Q’~P*¤It’&JÒ±+¢@¾NEœĞŠDU5¥˜ ú@G3ˆT+urnuBgî€«ª¯-ªjjÈÏ	©È 'ˆ€¸	T›QFr	„i’{€qõM²C•bÄ°Ğ*1©2¡zóZàT‘CŒ;sq®&D€d	Ò<O²,Y6÷\/‰ƒ¤„&Dœ¿Ò4ÍıY }JîC4;—»I¬Éè#èqü±åß»¼î9±İ–Ë‰ÿ ê{Wx“´1æûñÛŠtz(‡Õ«ÔpÇ»È©ótÿ ÊÇÄ°V=ÆEÎÙæÙşî;tÑq‹;¤îùé»$nî´•$¶U?+”£ëÇ›kÕÖ?Œ·4}_ÚKÔş/” /«ş“\¤#?ÈŞ—«Ú¹š* Ó9,ÓÙ5ÙX<t”#âfX@I®U.3g?(	‡9HÂm(Õ†°TšòÄ‰H™EKbIÕ›S@Š‰…Ô™ÎfH<`0TR~ó8¢r{T-d-BEe6€§PÀH$V¢@î•nJ´&
oİAeªKÔA)†,°D@/X$E	$L§QEÀ¦š"RŒ€…Â‰ ³X	€B`[<ë]ˆWVtçãH Za™©‹'€®Q!*Î*U9HÕ%”°ƒâI‰O¤iWÛ7_´âB5í ŸVæÏÕ™ã»÷¸¶¥¤öşØP4–¾ãÜøúZ|³ğqäîè_Ä=ã¶ßYìíË½Ş“° %·pÿ Ãçù>ïy²€HJGÏzÄ
3Š•5#)ûÆdÆæŠfpòˆ%)•ûu€ù9ôÈŸûß‹}]i»«£TÔ³kwó£·g{½EÄİvÛ€ã[­­ÛÛ×©A
T'„x¶îõëÙÊş¾^sû_i`\]\½@’B¶ÓÑ	¬vâîåËÙÀøò[¾Ú¹²pºÍ$M\Hô<ñØş»ïÙsŠíû{ZÑ¸ºô$Ÿ%­¯œrÒaÛ~Îô÷ç7}Ë°İp¼nóe»vÖÅË ¾´Ò%‰1ÓiÑÏ^ïal;wê àöñ­ÙØ{Üï™½¾ĞFª’ÖkqÎQä²G§1ºqŸNù’ÖC•{hİ†ÙÎxóİAîŒMÃ‹ì;jûn~Û»j“y×îÈµ
 Æé$ã4ñ‰by";K¸]~ïÈÚÙµ´/wÊ/481e 
F<*ùEÃ;+—-oÏ¿¶khàÒç}ÀN“ÈíÆoŸ³¼àë–œ5º\Bà‡Å˜èÜê¥¬«Eˆ2 ~"&TËÙ¨jõyÏªZÚêG TéÒ"—Ìšê•@ÈxÈFCˆ$¼ÖRğÎå!3êlÌ‚ıÃ(5)*«—QÄÑ^S ’¤Å©€ÎpIip>¢’1ˆ$ÒB:aG¥¡8dKTÄ¼°3¬PÃ•W	HzA'¾ €$—C4
'Ó8Š‹E2ˆ5X‚›œ	VŸSHSAããSsšàâÒZãB*¹÷Á¬ô“#¬S3‰ğ…`ò\D@4sŠÕP§Ó9-b2“Ğ	$4+>´‚ ¤ú¦d²¢!Ú\KÊ””ç9¬áBëÜÀD‹›3$ö9ç¤b÷O@\'.´VÖ®¥ç0¨qO^ GXÅx¿ë ÿ şÜm£†áKPÈ¡ ëî/•åäù“øœóş3»í?w±|é;7>çûG^£Ùu&â²àLˆ=#Æô*…™tÎ*"%[s.8.\£ö[¯†¤/XÔîÎ=7®ÿ Ô<¥£Ii!e G×yk§nºßÕî$•æË‘cº®İeì”ræù+\}ŞÔk€B1R>cÓ…fÜ
2Ò²0˜pÒŞ¬ÛPrñ‚$×„Í
¢ªÀUm×¡r)ëŠÒ£nT’I¤ÉƒXTc€$„TV„ÇÓ*ŒxÔ•LR2aQµPPtËÎ4UF Ó¤#]$¨SøEˆªÖ·KˆM +^‘¡&´j È$Ğ i/)t¾*¨<`[YÖr(#5MDš´aOg„^B¬êzÎTR©”GE` 
â^2ÅTh‘ÆiH¨¨Q‰TÆ~È±‚«I Ä¨"%£R*“)aö0L$8+º‡Œç(©bµ— G¨”="£çßòmû_«æĞĞ¿å¾hU
ÛÖ­»ßª>—É·î©üeİş×ëŸj4ú¹¹ºÙ¤€¸Ú]	ç¤Fy¾Jšw}¶qØe=ÙVeÓö
Î•€¨
;¨
F#¤Põ4Ï²ó€™˜ÀŒDÉÿ ¦7Şé~à½¡»~7‘»­ØaŸª>q×»Óü/Ìòû£¸ı¹gXc¾m÷i¶B¡RµAM±+ÑÓègmw³ìl»Úöã{±Ú]}ë{Mµã·´ë†ÙcKœÑ­©B±5ä²ôgi–ÅÄÿ >…qNa=¬İıÆ"ÜŞî·æ(P½£İ¼¶±5Ã¡íşœ}7µòî7´ø·Ş°uY¹lËæŞ¤
ÓwRDú›{˜lû[[¥£gmµ±bÃijÍ¶1­ò€ Œç"—ãmíîïâÈÚZ >í·5Ìk‰@=2H@'ËX/òÛW°¾İöÜ`²w µ\i®-s¥“‚„2˜X¿¸6ú^ûoŞî³²ĞÖß¾÷iKnq €ARPJ…Îß”½¹İ_Ûü‡²ÎØ3æ_{š=WXÖ†	ĞÌœa”^~ä‘3,ğò€ç_Pw-Ùr›MÎ Ñ»°B¨Bı»‘<Htrß»ÑÅÖ0Mí«%— -’,©†1–¶\‹Î-ÒÚJšò	Œû	
*%5g³·X®Ú¢‘€öDÅÃ«5$N€ôŒØªH LÒLê³À™óU@qğ†Z"âH¡iÂUˆAş"§å ¯ªjLÇ„€J(1I¤é ÄÆ§%'”PˆÔäÒ	«„ğÇ¬EAÅ‹œé”8
’²ˆ)»Oª•ì¨”ÁˆÒšë:m%#«1 ¢M@åÓğ ëã=Ni×F‚ª†±Q/X*qÂ‰Ò""×9­J!šOÌã"åikQÔ(Zæch¢HQ1FšKX¢ââ³I
¿¥fz¬ Ån$É	ıFnN˜EilÃ§p~“ WªUÇ;8úÇ?©½Âà
à´æ¢²Æ>‡Êòrwuâ•ÂåiÄ‚¼{È4Dº<ÿ sèíÃêô­—9¿HÎr=zG†½	µ\Ğà$€¥Iÿ Là#¥Üo +«g¸zÚp¨‹\™?½¸Ùé¶AÉ‚>¼ìòoŞº'ñõæßÖŞh×3{mk'm®~QÏ›ä«§ÌöË&A@ jL<ãæ=J­/3vf ˜r·NeI©_Æ(–¤qÁÓíXLH¢–‘SÔõÎ¶µ˜ÓˆÈxDmÍ- &gÆQDõú*"¡0Î
¬×82¥øÖ+6.ö½¤ŠcÒ*a^ÒŸ¨úZ˜.xFÑ3©¨¦‘hb!‚f³IN‹øtŠ¤U³gÁSâ³Q(ZT “l†B"`iÔ%%£së-HÇ—(R™ô‰–•ChA	2¨ñ1ªÁ¥¤`|"åœ—êšáXÒHzªNb.@‚a=&RÄeŞ0Y¢j=0œØPtÆ‘¦^şRlÅ¯«=ÃpÓqcİ°fçØcV²¥cßÃK–ó«Iú'¼ÿ õ°÷2Îİ…Ê¤¶èu¤?ù£§'ËÖu},j´–’zTÔ)ÇÌuTipCşÚş0fÒñû 'ÿ ˆ…¤ºÅ ¨I(šZÅ'; ¹œŸ3r¥œ&şhªòØ*ÇĞÚ¸éİíuí¬v÷kmx]£ùİç/i›N;o¶{m1Ãi·Ü]7o#[nĞj~§H,|İ»×¿^<ç=$o¿vØİíoÛlŞô¸!z´¨‰+–Ú¶K¯s_'+”´­2óHÛ,ù]ë¬ZÙn‹ˆ}æÜİs}?ÚºM—¯şqL,9NIüoqYß»muûm®ŞÕJàAm›=Í×‹…à•%¤5íAEŠ˜b6{»ûk–¸m¦ÿ ¸ÁbÖĞóíñ{‹¼çĞö˜ö½¡µdâ5z¯›Êí?Èï¹Kù¼ ¸ı­ıÕ–¹ì.İm˜ëh\Ñu­-q€¤wZÎÚÃ¶Û—XİíÍîKjñ£oóh:Ûí½Vİòğ5UÎŒs»›kÁnmò¼ÉcrßÉıÏ%»³gsbÍ»ÍÍNG¸Ûw©'E1œ·4¶tk=Çü˜úeÂ+.sv·7Ñ=®Ş]#ÿ §ßK{J·Lw®=Ş¿_9o¨6v»#µù-èÙß:7×˜eo1Q ¢ÊeÑ¼uùöšşnüz_ı%Ûòk[{Ÿ[ïn,Ûín¾ûÅ½­›¯k÷×áÎ¡Šçú¼>ms´z;ÎKd²FûÙ½©õ†çYÜ]ãß–¹+_&å‹ÜHù·˜ûo˜™ĞÖ¹®5j#àò3Çoš_Æÿ Ùô'ñ›N»YøGFo-µ.¹yŒ°+rádª…Ä$}_·æœºM£æspíÅ¶+yìnÜ³ß3yş3œ±w7¯mÀıÀù»gixÔ×#„|ï¼şJ}¿'‡·ögM<£sÛı1Ù‚ÎSpZUtÛcBr—·ó›zi?»E îËvÛ½ÎĞ¹]fãì•@}-SâŠ‘úm6òÖmï2óÙ…šÀå%–SÛÍù€!q8¤0Š€™@
­­R‡ñ‚å ®2³Ç¾QÚ}
¾¬>Ë
 $x*°€‰:€Ô"Iºôˆ¨ÌøÁ+5>g	FE7´&:š+R~ÜàÔSIIƒGõ‚˜
%	À…Æ—Äòä 4"³UŠ¡Á	"„.>#ç×‰Q.ip JRUƒ*w¡]2Õ5™¨)tõ ™¡Ÿ‚EEí	¤ñûJ*Æ3t„½ÚV€Ğ¹ÅighµÏPC•\ñÆ7¯ ıjagÕàP7Úä?ò	¦>‡Ë>Nî‘üR¹ÿ ¯ï:dmömjn] N8}ÏhëÁêôİ­j‰Húõé¥rR¸é2"G$óˆ°_`¹³İ0iS·¼À-·'ã%|ñäôõÖ oöíË j¤}}{<;Ş­çè5ĞÏ¬]¤	›¯ß´´“ö·BtŒs|•®?™î6LUœò>ÈùOR`5NDg:ÌÃ*qJjR™eQ®ÁO¦A*%À*¹*aSTÔRV ĞÔĞàui2AŸX¢«®4.]S\mÖKI]$ş°EÓ/89¦rA2âÃ–]£õcCîFlVuÆ€‚‚JêÒ4ÉüÆ¸U¾=:ÄX‹¯	€@a³ŸŒepaÀ’Â¸% ¢Íëßu¶.¶ãì»å^ÒåÑp	´äSÇ”«u³¿ª»¾[m¹÷Hm¶4½ï%XĞ®$áã+&QÛî6»»_¸Ûİeë%å’Ó¨jDŠÄ›KØÛK¯y…È—!‘TáaSC€F8zV„£Q„t •ÑDÉ'ç".dÉ>¢ïÕI‘DN¤‡34ÊL$ p2?l"ÿ .6Ú>¢^¼ßÿ jàv7 ºe×-¯Œ’=Ü/æå»…önõÛóí­óP?kÌqÏ¶~ƒumJ†;íÚ±­êú§¸næøhºõÿ ÌD|¸ê™"NIP“+@pñ€˜5Ø²QT	"t\1&û[îK¬“íñ.¶'ú¯n¬6~È÷lå§w®-3›ã;¯`ÎØÚ\æ÷¼OjÅ–îî³â¸m·"Ö½ÍmÆ1÷/îo|µhOíÛ8ùõô5²ÏÕÒ_òéœËÛq»k#híÙnîÓæ|ı]Z›v¯]AÆeg{u¾íºõñóLÃ‘Í"'>±¼¹±ûûûmŞÒöÓqo^Êót^oÀ¡APáI€TF²ti\ÏÔ¦İ¡níWœãöeãMû7w¸Ü\RZæ’÷SXyfônñŞ÷£@ä’½»y¯±ØÜ'+Ü[Áÿ BæÓdë{}D†—kxI*FwÚióY¯ãcZpùvÎß„`·?R¿|Ù{8ÙÙöõŸWË¿Ê]iºäD`"mè<cçïü—Ûkÿ ¿—ÿ X÷iü-ÿ ×ı¯ı˜mÏnıfçZïûŸê)ÙmÊ›Û^"Ş$ÿ ÄÑl$óÿ ÍñO—K·ãpõéü^ş»IøE¿£Œ××po¹.{p'rîÿ tXÕUW$æŸîŸ·óqzi5×ğ™{'ñœ]ö·oÆ²¿;égg›²Øñ\}á&½¡—.|:SÖ^å"¾qÂß¾ûŸùíş'ı¿ı^øêÃó?\;jÛVø»ÜÜ²ávÕ›>^ØéHwÂTV=¿oü7=¹ŞxËñêòó)Ã¬Æ·ËğÏ}õyÉóù¦Öã·—K/—.I®hEcZ=(~±úŞÇÁ8½1‡Áßï.Üruïß¨¼µ´Úïµ.ô±¶â^Jê{õ8õ$ş;íeÍ×?‹¥şCîvé.?J×Ò®üîFüŸ/¶¾Ç5·ûİÛê×ÈĞk#áuû>šëÂaåÛ‹“~»\şo`ÿ şGavÿ éÿ %Ííw<‡¸g:öZiµò¶<©ĞC–©u„¨ 3Âÿ ı&øß^nÒôşßø}·ãñ˜îéİïİ¼GÍŸ!s‘~ÚåËnm²ê9Ÿ2Úÿ ½*Ÿ©#‡ğ|Ü|»òqYŸ-;ã·æíÉ­’_‹†ı[îîy½Ãw”ìµGŒä¬YŞ‚ëeÏ·vë?¸×	@i¦ş2ï8&¼.¶ÏÉåßN¬isßQ7œ®İıÑ¶µkƒ½fê¶Ó×Ú¿lÉIS$%#é]õô¬İ&×ùVmîİÈ¡ºUÄ!ŒŞF>šïk½ÔoÙ6àˆ\KG€ÄF/&YñÂ×çwLv›Æ~jò£)5¬¾ÃxİŞÊÆèsÀmÖ‘ÿ Ìp"G¦:J‹·8.%:—cÀ 9úŠeIÄ¸$\P‡RbQAå úU\,Â/ô‚ 	Ôàä%ÓÏ§œšH:T’qOº4$—~ 	¹	+ÀÀËÕ˜¢‘¨\iÀú„„ÆPDĞ‰O	é
k"gN’¸f$¨|cH¶½«Òºµú‰@§¨"+LfåÎÔ’¸(=ßbÆ¸»Pw¥&$A"CúÇHaä­ìÓõ;%AuÆ¸¹AÔt÷ñ|±ãåù›ïñUßık»M{£”êùÇ¹í>ßÕéûD–49ÈAS¤a‚'¦«†¹UInF€}şqW@u»ÖÜU®¶ğ®˜*Âõ€ùçÍ9+ÓDF‡ºD–’3±;<Ş­·è™,ú¿Ù„Ë_"…&6.‰F9~J×Íä¶ºZPœUS
tè#å=ŠºŒÉÿ ÂO¸@2¢Â ” Vh©ãIAIÒ‚cÎ!…@5´ ÿ ˆÈ(HP„Î)'É%"µƒF\Ğ¡Î™™=Id|í(A\ˆ+p¸³v$éq’„DªF¢.Æá(
‰)Á· ‚	RšÈåŒáK÷†@*•Và0\wAÒ$Éi5”»ûµüÁ–v®où­ş«|hpQm­»îx]y7ñŸ«íø|îoißşÎ~{³Û¼cNÛ|í¾×oªå¶ª\¹véWÜsŒŞ÷(i„yfqÑìŞM¶ë‹}áŞ½İkq¶åù£·^Ñó¶–Æ:àX¶\§kıX%c[zeÛ^xúÉÕÛwwullØÛñÛ§ìövGÊ±µ·l6Õ°0I¯ê&.“£ÏÉ®oU¶÷ë'yì®³m°¿kyºÔÆ“zÓl5 œS8Õå³ÕÓìõÚfÎ‹®İï{‰äoòü¶éû—ï¯?w»Ù>ã™·ù—€
† Ÿ%Lc·o)ríÉ¦LOÇÖ|]#‰ï®G—´^Î»[h~VæõÂZçö±#Ùßï<zIÔûáväıVÙ¯ûüGqïÛ~é¿t9\û’r¸ª L#·Úòİõ¶÷ËÃü—ÛkÃÉ&³ÅÛçÕiÖ=¯•M«×!‰H¨ò‡ò÷b]İ½¹ ¦çƒÜÚ$õÚÜÇ èö}¿jÆıPÛî?owoºM‹–·F™|«{H'	N=N¾µ6á¼Öngzİ»éÒã¿ù/F„†UCÀ â’C”X ªMU(¢B@„ÁÎäßh´şÃ¸.ªÎ:Êj7·ìlúJ>†Î:½¯Ü§-Û—şÄXæ]¸e“{gs}g»möX-ë¼4¾Ù@
z›’GÌ¯¡Ç¤Û½Ã!ÙÅŞCiÈmù>Co»îKw›w™³Ç‹Ÿ´ØËÛìíºàÚ-4ê¸’é"SyŒtèË÷Wwm86íë®k/Y²×†ºt (fF½4ò¯3qÜ77õÃùŞëîŞ[sµÜn÷8½ï“aŒµuÁ¶Éb(EÒ#óŸü®ü<—]fq:Ş½şÓı¯Ùi¶’ç¦{NŸç»¤})úIôçi¼äwŸà¬oyZo2öôÁÚUGÌP	t~ŸùOºåéw²IÛ_ÓşÏÙğñõšÌß[Õ°÷‡-±í³yÆí½–Èh4Ú·¤ävä¸kÕn5Ïgæ~·üÍíİ—±¹È\·t1ÛÃşM‚s +S±û_àvÚKÉ·Âu¿ö~î?–×Kã¦¾WûF+iŞ½ÃÍqîşıûnKeºm«V¶Ìkmn$JÉ³1ú_·şídë¯—âø<ßÊ}Å½.?§Ëó¬kï\æ9î.ÜhCzã®i>®¼\Sk5ü#ç^~NK¶·óiww6÷/²ÍEÉ¨œh1¬sÛl®©4€Y* €€ƒ3«¦v›ZÚäĞ G(LEW³½½krÇÙw¯Ps¯»¬fÎKÕÔ6¿TŸµÙ³koeóî°+œÖ4!Ò]ˆP¾‘:ı¼Ïw®nÆğî}çqo9ïİ†ï´g¸nÇûaûKhŒ%Ë’¬NO·ãßY®Òm%Ï_wM7Ú\Î@pŞû‡Ùn¯9Ï}ËmÕvëÇ«Jq$ã¯Hï·vÉµ-h¸„4¶ˆˆAéH­Ë–×üÏî1À°¼zu4¨SÆf`.Y«û»İ¹kí7.‹Ö&Ñ¤¾OQˆ+$¤yøôÛY®oi‹ÿ GnMµÛ=;ÜÅš<´4š~W¤z#Çc½²u&UOé&ŠzV:G;İ¶ãhnvNyFŸœÉÿ ¸£´¯P#¬f3Âá(¦@Ğ Wİ¥@–“"f	>ªø{ `ˆ3¡'PÉp‚ á"°ÒrÊ
ZR¤ˆ´àƒH@Š(˜å Ë^Œ¦˜ÈÉz@Hµ„IHU. P0S€†ïCŠ¹¿J¤JnCú‰¢Ó(iUé®.SE1Eä!A¤†',¨gcwL!4²‘IùÆ†=¬!ÚfP¢¢SFÇ’¾»0·êo.„M§!XÕğïâù^>_™¹?î^êc±ã,Oü;©ıñÇî{GO·õzĞ(4¨¡$bsQãª®]¨ÔQ}%šVÕÅ¦´¸© ! š¸!Q„Ïä`o/}®lÃˆ3’üÇŠùGÙ×³Á´êØ¾¼Úú·Ùj„•²€Ô±íOÇ/ÉZãé´{Á­"DBiÎ]zÇÉ{HFœõÄARøˆi>Š"â° Ô½A æ0N..÷PHÅqp™Ã>´¬ „ê%µjõÎT\ZR@2\uV ¢oMR„QF3€˜İh%L¥zã”j3¾n¢ÜT „•\Ò6Îïæ–¹ÃH>§H8“E¹yB‚·I@ÄƒJöoü€˜v4ñ‚aå¿ä_y÷§k}Kyà·µÅÜâvOse·í°½Ï
à­pR‘ÓƒMúíİwû^-fºöïÛÕÈù?©ùÉÙ;ŞGpğË-,¶mÙm[s¤H(}H}%c¼ûn9èá>ë—»9¶ú§õ?Œ¶ÖÚ½¶»kåµÖ×kh.j­$‘"c´áøÿ wM¾÷÷Çö_^úÙß›ÛmnúÆÙ¶Ï}‹^Ú¢ÜŒß´ÒvËZ}ÖÙë:1/Öáâ[ó÷vÇw¸Qò¯Ş->ßû‹t’Ò\*êÆoñÚ[Ò×Yü§'.³ü½%ôO”Ùı@í×woøö[ä¶œ«øû[pórÅ»m²Ûºš×\g”|oä8¯5—»ô¿Â]>âİö×³¯mÃ® ~0 .˜ t‘#õ;ÖÕÃ8]`*ĞZ(hg_ì/M¿'âÿ t¿
É”Ò„Ê¨1'Æ>³ó4Ú@ì`ËÍŸËİ¡»ÿ fnÆß!¶d­·é”ñ1ìû{İ6™^ÕûMÅ¶¸‡2ÛÄ¦B0Ì„dy²ú½ÚÛÓ¿í~Şßÿ jâøû€,•Û[dÌõ“{×©™’H ÀgUde<+¤êõ$*ŒP,Ğ)U\ÉîÎOñÜ¸'K»áXã‡ÿ ®¹Äûıœµ{»¹^¶xıÇxrVow\M—Ûâí<ww;Ç2İ­»	TuÛ.Á«5îÓ7ôÏU¿f1œÃcÃ\¼şSänî9äå­1ÆÃùMÃ~uÒn k?Ù²ú!ZŞ[×´–TxÃº·i%ûİ½ı«ÜÉ8¸[.a1¦Qø=œcé>åÇaÌq7\v›–î-‡8É—›ëpOÒÉÇä¿ãızoï1ıŸ¤ş7oÓ¶¾×ı»‡Ó}óYÜíı­óiî(Êf:ª$~jLmK—®•¡}xãœm½å¤ÜöË¶Jâ±êş'o¸Å÷rû‰åÅŸƒË¼îëjà>hp!ÄtIlçXşµÅrş{¼ÅÃ5°~á¼…Ş7lR×!l¤µMc€t—õ'„{4¶^%éÕªï6ÇtçŞq6ï\·¨Ú¸ºƒJyGM´òêá6ÂßbãòÀ3}#8ñ×¯F×±Ü>ïşÖÎÕ·n¾nâæıs¯]¹³:ÇÏCmÚèh@O¨©v;Æí±·Ş¿e»n«WêG‚ƒî‰èÏ®*şÎŞÕ½%¬ÚWR¦8˜V»IÇîÿ ÇM»sş8Ş6æE¢òj-ÍRF9æg¾7U´ãVL4IšN+Qßş”oFï·Ø¼‡mŞàğtĞ”˜ğË?SÓ­Ë¢Ú¶öAE  ªÔ$¼ã“kû;;—EİÃIùVtŠà£Y /‚V1w’ÉëèÔÖÙo³1k‡º»`Gn6@+[5cA:š³ Ê<×î'éöİÛèßÕïªñœnĞ\Ú›×ûmËuóéKºV¬ŒKÍ¾6Äë¯§õêŸKLë›Ò°{½«œéoÌo¤’¾Ù~ô5¯²Ó`ÇØäxòİı§Í$~ô™bwgZõpÁÓÒW57"»n¬Öd‘)`§2İH@k§Ú@Raª^’#,H¤€«Âbg#5€4	RÜæ¤æ>è$£Hcr- åùÁMÍ“œÈ)Æ´–pe¤“á&¤…3JEsXI ×bêô”TAí
$ ¦ Nä‰K‰BW¬åãŒj,b÷@Péq!i"”_#K……¶–Ü“”Á•)Ò4•ä¿¯¶Å¯©¼‚…cÙlêIÍ¯„{ø¾Xñr÷mÅ‹€wq°ãÄ[*0ÓºdÓÀÇ/¸í>ßÕêë &–Sô„ôÏùïZ³Zã6€ãYP”Quh1×X ©@:š{LZaó×»FxÚ%Ë²è/<a[NÏó’úVñkê—eÜtòûJÉq9>[ø&Ÿ4{ëAÊ‹ğªÏ¥#ä=éÈ3úô€“P‚	PÙ@˜@)9¤8Š„Ê¸AF Q¡É’O
y@SsÀ!Äø¤‘:œ¢ÁNãÄĞà€	c/
B¬‹{›Ÿ—êo©
'\sˆ¾+û­'ÓCE+3TJ.Â‹wo@›¨Bb
tCopòQ’
&¨‹Œ²Â7±[Y*/9„§ãZ}-sÊ¹UQEÀÄgâJ–™‚&‡İpò¯òÆæãoß\=Ëm›ŞŒÜ1……‹÷F)¿·í^_¹Ì“ŞÛåv›[vw—‰Ûrfo¶öÛp=²òàÇ;J£ki˜OJòfú«qÖ·;ıÕ­½½ãì“mÎù¤½Á¢İ²ã Aò'{İ.Go½â·,Ù?qó]òí^~Mç5t8;‚…
uˆÖl¬k;¸76îmx{7Mac»šC•åÆŞD6˜ç´×ÕÓM¶½#Õ?Å^YÛÿ ¦}Ã·½a¿7cÜBåÆ·ÒKw;F(^i…ü¬Ç‹õŸÿ =µ·oÍÚl\x|ÓCI, H:ˆ¸£àÉ—ì·Ä™­›õ2óZN—¾‰BA­öz]6Ú^—øÏæyuåÓMµ¹™³,Á(Õ)’™ˆúÌ¢Òg)  VXÎ*8/òÆÁwmv~è5M[qmÄ”Qwh 9Ç£ƒ½}´}æ¸"9ìÆMR'áB<˜}6ú/»ÿ #ô°·†fç³r©[-6Œÿ ğÇËŞckø½Mñ«¨ÕR¾ÈÂ˜¢S#ÃÊ] ˜6‘,ÌÆ+e „*Ì&U1VÇÿÙ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             xıóblob 3315 ‰PNG

   IHDR         àw=ø   	pHYs     šœ  
OiCCPPhotoshop ICC profile  xÚSgTSé=÷ŞôBKˆ€”KoR RB‹€‘&*!	Jˆ!¡ÙQÁEEÈ ˆ€ŒQ,Š
Øä!¢ƒ£ˆŠÊûá{£kÖ¼÷æÍşµ×>ç¬ó³ÏÀ–H3Q5€©BàƒÇÄÆáä.@
$p ³d!sı# ø~<<+"À¾ xÓ ÀM›À0‡ÿêB™\€„Àt‘8K€ @zB¦ @F€˜&S   `Ëcbã P- `'æÓ €ø™{ [”! ‘  eˆD h; ¬ÏVŠE X0 fKÄ9 Ø- 0IWfH °· ÀÎ²  0Qˆ…) { `È##x „™ FòW<ñ+®ç*  x™²<¹$9E[-qWW.(ÎI+6aaš@.Ây™24àóÌ   ‘àƒóıxÎ®ÎÎ6¶_-ê¿ÿ"bbãşåÏ«p@  át~Ñş,/³€;€mş¢%îh^ u÷‹f²@µ  éÚWópø~<<E¡¹ÙÙåääØJÄB[aÊW}şgÂ_ÀWılù~<ü÷õà¾â$2]GøàÂÌôL¥Ï’	„bÜæGü·ÿüÓ"ÄIb¹X*ãQqDšŒó2¥"‰B’)Å%Òÿdâß,û>ß5 °j>{‘-¨]cöK'XtÀâ÷  ò»oÁÔ(€hƒáÏwÿï?ıG % €fI’q  ^D$.TÊ³?Ç  D *°AôÁ,ÀÁÜÁü`6„B$ÄÂBB
d€r`)¬‚B(†Í°*`/Ô@4ÀQh†“p.ÂU¸=púaÁ(¼	AÈa!ÚˆbŠX#™…ø!ÁH‹$ ÉˆQ"K‘5H1RŠT UHò=r9‡\Fº‘;È 2‚ü†¼G1”²Q=ÔµC¹¨7„F¢Ğdt1š ›Ğr´=Œ6¡çĞ«hÚ>CÇ0Àè3Äl0.ÆÃB±8,	“cË±"¬«Æ°V¬»‰õcÏ±wEÀ	6wB aAHXLXNØH¨ $4Ú	7	„QÂ'"“¨K´&ºùÄb21‡XH,#Ö/{ˆCÄ7$‰C2'¹I±¤TÒÒFÒnR#é,©›4H#“ÉÚdk²9”, +È…ääÃä3ää!ò[
b@q¤øSâ(RÊjJåå4åe˜2AU£šRİ¨¡T5ZB­¡¶R¯Q‡¨4uš9ÍƒIK¥­¢•Óhh÷i¯ètºİ•N—ĞWÒËéGè—èôw†ƒÇˆg(›gw¯˜L¦Ó‹ÇT071ë˜ç™™oUX*¶*|‘Ê
•J•&•*/T©ª¦ªŞªUóUËT©^S}®FU3Sã©	Ô–«UªPëSSg©;¨‡ªg¨oT?¤~Yı‰YÃLÃOC¤Q ±_ã¼Æ c³x,!k«†u5Ä&±ÍÙ|v*»˜ı»‹=ª©¡9C3J3W³Ró”f?ã˜qøœtN	ç(§—ó~ŠŞï)â)¦4L¹1e\kª–—–X«H«Q«Gë½6®í§¦½E»YûAÇJ'\'GgÎçSÙSİ§
§M=:õ®.ªk¥¡»Dw¿n§î˜¾^€Lo§Şy½çú}/ıTımú§õGX³$ÛÎ<Å5qo</ÇÛñQC]Ã@C¥a•a—á„‘¹Ñ<£ÕFFŒiÆ\ã$ãmÆmÆ£&&!&KMêMîšRM¹¦)¦;L;LÇÍÌÍ¢ÍÖ™5›=1×2ç›ç›×›ß·`ZxZ,¶¨¶¸eI²äZ¦Yî¶¼n…Z9Y¥XUZ]³F­­%Ö»­»§§¹N“N«ÖgÃ°ñ¶É¶©·°åØÛ®¶m¶}agbg·Å®Ãî“½“}º}ı=‡Ù«Z~s´r:V:ŞšÎœî?}Åô–é/gXÏÏØ3ã¶Ë)ÄiS›ÓGgg¹sƒóˆ‹‰K‚Ë.—>.›ÆİÈ½äJtõq]ázÒõ›³›Âí¨Û¯î6îiî‡ÜŸÌ4Ÿ)Y3sĞÃÈCàQåÑ?Ÿ•0kß¬~OCOgµç#/c/‘W­×°·¥wª÷aï>ö>rŸã>ã<7Ş2ŞY_Ì7À·È·ËOÃo_…ßC#ÿdÿzÿÑ §€%g‰A[ûøz|!¿?:Ûeö²ÙíAŒ ¹AA‚­‚åÁ­!hÈì­!÷ç˜Î‘Îi…P~èÖĞaæa‹Ã~'…‡…W†?pˆXÑ1—5wÑÜCsßDúD–DŞ›g1O9¯-J5*>ª.j<Ú7º4º?Æ.fYÌÕXXIlK9.*®6nl¾ßüíó‡ââã{˜/È]py¡ÎÂô…§©.,:–@LˆN8”ğA*¨Œ%òw%
yÂÂg"/Ñ6ÑˆØC\*NòH*Mz’ì‘¼5y$Å3¥,å¹„'©¼LLİ›:šv m2=:½1ƒ’‘qBª!M“¶gêgæfvË¬e…²şÅn‹·/•Ék³¬Y-
¶B¦èTZ(×*²geWf¿Í‰Ê9–«+ÍíÌ³ÊÛ7œïŸÿíÂá’¶¥†KW-Xæ½¬j9²<qyÛ
ã+†V¬<¸Š¶*mÕO«íW—®~½&zMk^ÁÊ‚ÁµkëU
å…}ëÜ×í]OX/Yßµaú†>‰Š®Û—Ø(Üxå‡oÊ¿™Ü”´©«Ä¹dÏfÒféæŞ-[–ª—æ—nÙÚ´ßV´íõöEÛ/—Í(Û»ƒ¶C¹£¿<¸¼e§ÉÎÍ;?T¤TôTúT6îÒİµa×ønÑî{¼ö4ìÕÛ[¼÷ı>É¾ÛUUMÕfÕeûIû³÷?®‰ªéø–ûm]­NmqíÇÒı#¶×¹ÔÕÒ=TRÖ+ëGÇ¾şïw-6UœÆâ#pDyäé÷	ß÷:ÚvŒ{¬áÓvg/jBšòšF›Sšû[b[ºOÌ>ÑÖêŞzüGÛœ4<YyJóTÉiÚé‚Ó“gòÏŒ•}~.ùÜ`Û¢¶{çcÎßjoïºtáÒEÿ‹ç;¼;Î\ò¸tò²ÛåW¸Wš¯:_mêtê<ş“ÓOÇ»œ»š®¹\k¹îz½µ{f÷é7Îİô½yñÿÖÕ9=İ½ózo÷Å÷õßİ~r'ıÎË»Ùw'î­¼O¼_ô@íAÙCİ‡Õ?[şÜØïÜjÀw óÑÜG÷…ƒÏş‘õC™Ë††ë8>99â?rıéü§CÏdÏ&ş¢şË®/~øÕë×ÎÑ˜Ñ¡—ò—“¿m|¥ıêÀë¯ÛÆÂÆ¾Éx31^ôVûíÁwÜwï£ßOä| (ÿhù±õSĞ§û“““ÿ˜óüc3-Û    cHRM  z%  €ƒ  ùÿ  €é  u0  ê`  :˜  o’_ÅF  IDATxÚì–_haÇ?çì?±Ğb©•Ú–E(\hÙEZ”ÜrGíÂ[7’W“+e‰Üp1’‰YJ“â5ŠÙ¬3Ûì³‹ıN{½ÎÎYÜùÖÓó¼Ïïïó¼¿ïï}Q_¨*ê)µWÍ©µjŸz8d¨7ÔaµPÁUŸ%@°Y4­±®¶ ë™ÃVàĞÍüØœH€q`*6'_±6#+¢¿Â Ã@gê °¨Bİ¥€Õ¨Él~@0?JèM ¹ì	ò@Mç#ÀQàğxëKÀ†”ŞFà,0•„Óâ‹
±;O'Q™u}Àà p&¾›âéF“¨šæpp¸J+b|KXÜ®¥ö‡];°-l»€•ÀeÔ«AŒµA­S[Ô»êwµ1E´~µ;õ\nœTGà°¸ŒÅÑ€/À`(•íë [%Ø	|NGÜ®öÅª«JdÕá,ÚæÉ¾>ü\Ì
Î«ËÖª/ÕuY½ë 1[¦‹\ô¡R˜MÀ`o†Ù­Àm 8-„ÉƒÀ.`èŞ·À °9*ê™¯6Èn`Ğóà°	¸?×½ş¼»ê§¸k*ê´º¯”üo4»ú˜ëJ	ÿy7ı àgÌ…J>8I­VÁŠß5AÎö1<È–Õiõ‘š/S–û£OÆÔ¯™½B”{ÓÌ º")ƒ”KØ    IEND®B`‚(3.î                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ÿØÿá Exif  II*            ÿì Ducky     F  ÿáhttp://ns.adobe.com/xap/1.0/ <?xpacket begin="ï»¿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:DocumentID="xmp.did:0FEC025434E811E5B480C51F3DF34CB6" xmpMM:InstanceID="xmp.iid:0FEC025334E811E5B480C51F3DF34CB6" xmp:CreatorTool="Adobe Photoshop CC 2015 Windows"> <xmpMM:DerivedFrom stRef:instanceID="61EFBD244302B1F279CBE81F087398BC" stRef:documentID="61EFBD244302B1F279CBE81F087398BC"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>ÿí HPhotoshop 3.0 8BIM     Z %G    8BIM%     üá‰È·Éx/4b4Xwëÿî Adobe dÀ   ÿÛ „ 
				




ÿÀ XX ÿÄ ®            	           !1AQaq‘¡"ğ±ÁÑ2áBR#ñbr3C‚’¢S$Âcƒ4%EU     !1AQaq‘¡±Ñ"2ğÁáBRbr‚#3ÿÚ   ? újü<W¡æZ´=œ<ÕF…z*«Ö¨8yù¨«P×ÉAb‰>,€ÀŸ]VU0[Ïš¢@èŞÔ\		T%Eë±E_´A¯Ş¢8(¤ OJ N ªËÚ€R¯š F•áÉ ¥%@¤}è/j EßWE8$ë¡@{oAª0>ŞEAjÖšÕIr&¥kšSDF]êÜçîHD¢QD8„±¾ô'íD,È(-ÀÑF ®ŠN:tC:èÑIÑŠ¥Q¿¡òU•1ú›ŠÉoÁzqà‚q*ÀÓîF„QQ(‡Ú€€¢Ğ=2 t	@$Ğ$	„Ä\Wò]œíè=È‹öƒ2*íºUˆş¨,@¶œª,kçÁA7ÿ EDÁæj	Z%J¿x4-Ñ¼jê4°=Ê)2@ßrr5A	 ¾ô@Oú ¼8ğT
TÓÔ 	:û‘ ƒÈò@áÍ«0 
Vt@I"ªÜ:†òDg]?Üsêá¥P.Š©ûÂ	
~H%iÏTì(.@¨Ô‘P2%:tBj¦IÑQ•E%R¾ìB¬©†ÉQfŞE9ç@â‡Çš[“…
¢EL ’@2Ğ/¹@è$	 ğØÿ ÙÅfÛiÁzßĞ[¶€óE‹1QGà (¥yÑêÇDÅ*‹W±ËD+Z7X¢Ÿï@/4	h1báeT@dO
<‘B'^HŸ±TaÏ!¨@)k^(!Ë‚"@"l3rä‚ÀĞpä ±eIÑk…òDfÜızù ,<ˆ©ƒÃ@‚oÍkÁÁsâ‚Õ“QÉrF À¨¦%:tC:¦Lè†t	Ğ$Tfh©Tïñn(Ê£¼Ÿ–¨,[cäŠ8ª	*ù¨AAQ£”j‚A İ Z t	@î:::Aá0“.®+V§]* ½j`>aR.[áªeV`x(§Ü€ÑÓG@P_r	ö%à‚æ9ÑÏ‘A¥gEf&„(§@*{P5'@Æ¡½ çËÚ€2Õ äúğDT¯µP2(ç×š·ßª	^aa«‚€ñåÉEY´ÁæÀRª
·M>ŒÉŸDJ{Dê£ ,‚Q.‚@ûĞZ´tæ‚å²ÁA¢ËDáÎ¨N¢Âª‰D"xª–ô@üÎŠÌÓíUE+Ä‡bˆª?UYm?‚( ø ˜5DF…
)ÎˆS:	„T‚::@t	Ğ:Å@µ@è§šèâ³jçUÛW ¹nğü}PX·{ƒÑEZ…ßj¢Ä.¨…DÄ£D µ"Á¸z¨+F¡µE[ŸgQOàxz rP7’hH P
O¯µ9xWø¢ƒ +ÏŠHsDU(H7T‹P 4yêŠµ*P)šaKÇá<‘„¼¹rA1WâQSš “¿Ü‚Q>>¨	§4m8nh-Ã‡±Aæ¢œ gö(†T7Š~j†Ò¨ù p ŒÊ¢•ã«"+Šš{QV-Ğ}È
	ö ª@¿æ‹£Dˆ` ˜.Št	Ğ$è!ÑI@‘	º
tƒç±24+nbÂñš!•J•¡–ÜS"Í¼Æûh¦E»Yƒ‰óL‹PËûíåsí@xdí¢ ‚ğ`x ¹‹t>¡¯bnJ"®D¸QR<ù Z^hš¸ bÿ è‚'¹ äOàÈiä€S>ˆJ¿rù ^ô5ğ@hòû‘Dà‚Ì4P4øğñTSÈ–¾ÃSÅq÷¢¦/`@ú~&>Å#á§-kËÄ ·o‚E•"¼x"û•td[ĞñT1-TôPBzW‡E;ºk^hwÑàx2ƒãíA(šó(üP&‹-–T3ÿ ‚)ß’@Ê¡ÂèCº"’¨J@‘	‚İó‰¼ÇPëNfùíBj¦C~ë‡RÎZ!™­|”ÉaAnª¢opmd™L-ÚÜM>'ğâ®W\µ¹%\³…Ë{ˆ×«ËÕ2aj9Àñ¢¦»~O[UÕ•—E3FªÒÆ²ú(©ıÊˆ$	İñ!şˆ xòEñ@9Q‘ dP­êˆéÇ‚)zú"$“Ç—Q?$Af,ˆL<Uoš7QD— Š˜•kª	‚A´@AO¸ ˜:qüPYµËŠP%££(°î g†b%Q§ŠëEBP […2ÉQNéöx [Ú€ğó®„  %A!îP:)Z‡4P7¨z Nª¢Ğ'@î H)Ñ	ÔRU E|É;‚ ëÀ­V•âR³@g}/ê²Ğ2É>AÔY2È§h©G2¢¬€ğÍ?Õ¯‰…›yÄ5|Ğ«v÷	jä•Sv÷"ÚĞ&GO±f¢5ZÕÊ÷v¸sp+ªè±­dĞUÔh`YD; ¹ßg@Ş^ÔPE%à€R&¼Pòä€r÷~"jEÙÙ†¾N#Ùø 5°§¢ÌE*¡¸ª-gäÉªÕeAÚšÿ òEL¯¢	‚§ìPN%¼'—- ·MT Àô@¾õ8ô@½?§‚zû•^hÜÿ Ñ&íÉQRñ« uÑãåDàèŠÃßí@x—QRQQãàˆUNíªÅS&D:¡ NÔşÔ	ÑIT'ö N pŠpTT‚—nM½Gª¬áZsÔ••WÅ"ÅiİÔºŠ	»£y©âñ©A8ß•+§%Thäj¨<2ËÑù:&mf0 y4jåuuîá¼êôœ#÷•Ô«ø@ti`d8!»ø"ÑL‚Õ	ŠÛš R'OT%ô×Á9DIÑÿ ’$ù ±oWz©E ÍâTXÂ
©Y™rgä5DQƒøª¢ ›ëà‚NÜ(€€òÿ D¡ĞXµ­*Bp,4Rƒwöe?ú j~HÎš‚‰oÍ<ı¨•BÕfKsTT¸€Q%ÊÁFêP-(€±:?j <}ª,HÔ"¢Oµ8QRÓTRD7Ø­%/ïïU	üP:è H pP$Â¤
Ê¤
+å‹’wa_YŠ·'âë5¥K³æ¢áVsô
5 7]Zª!	—¯‹~Jµ„şo(¸L]Í–™A?z44oUİ2Ë«í<†¿ĞôB“»#ÖvÙ¼AÖ€Ñwb7ì£qlxp*ê!A!O?zãâÜê‚2HòáÁÉ ‰"~ôTããÅœñ×’)Ş’ÅJ«/FÑE€]“;pB²reÌù:¬ªÆO­UTÄ‡¨A0xpû:	¿P$R€°ª<}€ ·Ìù¨e¼P1@È…ÆœQL_Ó‘DF¨±>
ˆOEEK¾5dI÷ <=Ü>^Ä?ÛDñôñ@x
*Š*'ÜŒœÁEIÑIêşäC:¨_zî¨qï@´@ª|-
?4õñ@à¡j$
ƒå[’z¢ª\(*\™ ƒ¬¬ª—$Ü[€YiZRÔûPGæÖŒ‹”ÅŞ>ôT£t½hU¬ˆ.‘ÿ 1F‡…ÑO**Ë¢í|ƒĞ	©æ§«ïgÚ%Õ¯Dr’Æƒ’®?¨ÀqÕ!ø Z~høiÅíDOÇ’ 3<”'ˆ"ş¾H"t×‚“ÎœĞ3È p@ {ÑS‰å^h,[<9rJÔÚT‘^ìµA••*šú*ŠâJª`ûL~'GİÍâK·$‡±‹râ‚Ô$ 0—ğQOÖ8 ]UÕz¡LHD'Õ8à‡¿’ğv@+†¤éâµ[Á"îÅŠ?$ì€‘æ€Ñ*=P$"(±%T¥ÇÅ‡ú Oöâ¨TÕºäë§	ÿ Šî	ÿ Õ8QRE|£2ïÓíUUfCr+"­ÙcöuJáãÇŠÊªÎ@Õˆ(uPŸ·ª)úš§–¨Hs6¯·Ø¨œn3?·À¢nèg.IR·{vïN|¸*9òv{†É>«pò^ˆãN4¾HÔ] à¢œT¹>*!üÎ¨êy \Ééù¢ƒ-?Ey ŠJM¡`‚&MÆ¡	}'ãöt­(=È$ù =¹1
USoà §zàbòA™~uüUà¨˜>(	È‰‚ÿ mQDŒ©M8¯€ÕXdŒÀÕJ&.(%ó_My¢˜\œ/›À”æ¾ÔBùºñ¢)şgØ!ƒ‰»Õ.ºPÕ&y+Y—và¨€@x×ø +ó@µ5ö ”xr@h–¢8**'ŞˆAE‰?z)?«$åñ&ª„ô¯¢û	øñ@$šè(†A PHò|åîà£J—$M’*­é}‹*¥vT<eU¥*y¨°1 á¸ğäŠ³cõö‰cZ…KpÕÇØnLƒ:ÓE©+Ùz=¼H<ñO$gÛò‹–Ó’Í†V6­²î>|d¹)bmÙì[P·Õ¾åŞ8Ç_‹ áÅV×Åyšh¢¤Ü†ŠÓğD/RruáÅôdš
ó5}<¹¢+Lûy Ÿ=Uë’	:¢@òòP8<~ô‰@A.*U)Î‡ìîÜÕ¾Á}Ù¢¡	*&(Yã$ˆ'ü|Ğ.è,@Ñø”ë"ŠP¾iQPùŞ:¨¿Ã‚ó›¯4_Ó!|î ª$/ë]QPL^­jJãøø« ¥'ğT4O:s(„j~TA(³ ,Ğ¥z(¨Hª„5óPÔhÏèˆNôÕT7Ü™ÃÍT3şHı¨ä¨¿Š	Àh‚AAòLäçU+jÓ¯K"­É=4z‡S-E;„š^ )Z+X7ÎŒ"yFÎndŸWÕÖ¦µ‹¶]voˆÄ|Íuš¦[Ö6XD?BÚ-Çhô¥Ñ¬iÅ@[La|LE¿Š–3]Ùj6¢ Ã¡Ç,8*Ô^„Ø(¢‰è s P.>\"Yê W¸õÔ"*ÜãÇÍi|Uê«hõğEHK‹ú¢$Z œO-QRö2”äõPQ»s€H*JOù«‘(š0ûA¸x~($·$Æ¨	hSTeşªNãk¢”İ£êZ7Î§æˆÍtó\PÕùÆ„ —Î<UöjÑE7üV²‚Fó°$DºŸÍhN€Ğğ@Píáªú{PH5áÉ(¢ê ˜Eõ;áÅëÇŠöª®Š†ª!R£ŠfòâĞ7‹¦BûC¾¨&A!÷ Q_#\›Ş@(Ø.í×‰ ñ+%±fÖÍzóuƒä˜Ë>M\^İÓàmªÔÕ2ßÄØ#ø}ËSS-ÜM1o†£‹-a8ÛtC<i£"´-á®ˆ
1E)]FX`è)÷ ìÀ WD]±fQV¤WDcs@è¢‹¡ªTù5A!psö qs‘ò@ŒéåíA1¡>ª€\¸ÿ ¢
×% ©3íâ¢îÁ: ˜>¨$	×—ÿ Tgü<Ôª¯vã‚ ¥vu*EIÖ‘8Œ«æ‚qóC	‰QâXíŸt(,	P{ĞFe”¢µÉóÿ R³@LÎ¢ n§Ø¢£ó^¨æû!…ÑN\Kç1š¡Åî:¢%ú1üVm^%VW-ÉÖx³sE5óä€ êè:º‰à€°ñò@Q¦¨ IşPEÿ ‚˜ôQK¬"Î¨§ÈdıcBPK©éÅt	ßD	Ç5P#BW‡› CÜ¨“Qò…¬+³“³•†òØÀÁi aÅjaœ:LDº­ÈVŞ6R¿Š¸L4ì`D
É~Ş,b4¢‚Í»QMAD4â‚BàŠ_-ü‚!ºÉ˜DÈ(	Èi§.h'¤~H‚ü=¥…î‚B÷¯?$óÇ“*^ kä¢¢oş^ˆªÓ¼_2¨«;áõ§á£ëª	‹¼	ÕÅÑN_yA10~äDÄ€ÑC”ÙüT¢­Ûœ+ÍaT®\õ’)„¼VÌ$$L&%Ä¢á17¯DÄôãÁŠ"q—‚Û—ú ±S“rAK^<T¢¥Ù×’ÍúşŞ*4‰•OPDÌWÅÁ©ö Œ§^\1¹Êªˆ›¤h|†ùÚ6ªø÷¸…¨[%ØóÕi¢xµ9‰ö¾¨	Aù gaOb	D×Áb_Ï‚½õDBRôE«É@¾bÍ©§Š‚øº _¸ñ¢	G uâ‚bû1A1|>J‰‹Ãš%óÑıcò@ıT@àû$D…cg ·KqW
ÓÇÛ "šÕ\[1€öñ‹öìÆ#ğL‹6ùpâ <fjè°hÏ˜ªˆ0Õ$üx¢“p@Òob2fìÿ gD3>š fbÜy³ ‰™qA™ ˆc| Œ²xpPy>( NøàhtA^W‡: oœMPJ7ŸJ $oiÉıŸT©åªNûĞh²ª·.êë"¬îh¬RÍ<U)¯ñURño$DÄÂ&Œİ$eÁüÕ!&DXîA“ÕJ)^›y,UŠ†áÉ›ÃÖª7=êˆ›”Ö¿Š›¬|uğ@3tóõAu†¾h]ø‡ŠLIhÅÇ¨«âÜ´‹‘:pû™bX (:U;âD¿ŠFFƒŞ€BŞhr\½UÀ4×’”
Wé¯‚ŠÌ–Ğ©‘^Yñz)•DfgfĞ xæs>Jåœ¯È Ì¡2`Hå©Te¡tL&2¹*‚¡Í#’çìèÎÕªF\MßÇîTyÌpãP ZQchÄADN£Š	Æ%#íP!ÇÚŠG@A!ÀWŠjDhÿ 3…Q2qsEKæ†ûjÄÁüUdœ.Tj¨UAåN( `Hä‚&Ô¼ĞÙ›qô@9Y“"+\·?éª*´âxğPBGƒóA@àÉ„Ëû“_0èx ŸÍ“0Ğ cp·Š€‘>j4¯9f¨¡™|8 q{€Ôq@XÜ%ã{‘õñ@h]<Qc7õZ€öä*ÄfÃš Wn5}Šû÷xpXª¨nšV¡EGæê|ÅDMÇã^(+œ8¢„oxÑ?šŠh]y½JVŞ¿O]#ìsAËÅQn%ˆ9 (>ÄOtdşÿ š ^gA~ëqª”Q¹@>
US»’_ÇŠÊªË)
ŠˆÊ<J&CS¢¢C(V¨&2š¢H¢Â8ø¢$3||Ğ9ÍÅ2`HçxûUÉ­æƒÅ2˜\³˜%GÕ2a£f÷PgÖ‘nê¯J<Är¯%¤Éú"u	1: FÕ=tE/–A¦¼8µA*º„¸ğBŸ©¨÷ ]mçÉåêuDJ&GŠB/N*ƒˆ?ƒñüHZêò
‰‹ãà‚cèÈbñj cŠÑ §„$¼”L)ŞÛß‡¢
°t£pPT•™DÔ\£òü?$ò¼+Éo–ExhèÊ<EP!hè„4¬Â… \²xz¢«ÊÉrÁü¥G¢aSÎºş
 ‚Üœ?£ ,"iãª©•ˆD—û¼QáÆ¼Ñ•~@®[5ä²ª9¤\€³QŸ;ŠÊä)‘:e¢fF®ª£+„ÓıQC•Ç§¸"+‡œÜ¢¿~Á
è6ùPqn# Ç•ŠÚ.FN¢	¨¢ƒ­X Dúq@®º <>ôzAZüˆŒl«‡â¯…TªÌ»wPµa¨§rï.<TUi\/­B*mæó£Õù²X _¸òà¿u!ä5ò@ã0ø ˜ÍæjLg]ÁÑaêAw2 NÔFæ&[°÷-FkbÅ×‹Áj#˜a#Cê¶‰ÄÄ|JŸÅ†òE8n*@<!ŒÈcl¢†`CŸwSt¨ª¡ÀğL2-¸: µnxqU#äÜQF@XÀ~jF#Cæ@(%òÃÅ6FŠÏ¦¨*]ÅÔ3„Ù5v×ñDg\Æ6äAä Ê§0QKåWìÈårÑ¾SĞêt@—ûq@)X}U8Àğ¨Q£~Øz
1…¹†7‚"c‹2 ±°ß~•@hÚ4p€ÑµÁ‡ñ}TÂ¡<@_‰âè<xU0€\ÛÁzSŠ˜nmÁ¨8)â)ÜÛ¼?Š˜o`Lh˜«•)âŞ[ÅfUœnÀ~\£jmp?µAÑmó?¹tŒºyèËE\ŒÇ³D·= ñ˜o¹U#/ãæFEşõ‹r¥PÛòAK&My— '’”c]¼ÇËğX­ÅIŞ'ò*¯+ÏáÍ£ŞŠ_3†ŠÒ¸Üiø*ˆ™ÿ  ‚å5ò‘bç§$nò¢"ÿ Š*# æâ¦˜¹r}xê…“"E¤K*Æpé1/¸Q—:ì]éÃ’ÙF„³DÈ<.xÑ2/áæ™ĞõÔ 'ThI×NHa AÓš‹ƒs©óUÏ‰LgÕQ!>ÄÅ<08"
Q¼B( ÿ €±wP4×Õ@QÉÇ¢	9 ~üe®¼V½dTªŒÌœpÇÅMÙ|¹t*)£r§Š® p¢"b¦œTù]^‡ı³×ÚŠCà?41äª&0CèŠ˜Áè‚_³La tQı ¥*ŠÅ‚!ÿ jğE1Ã†œXCR<‚ Ï r§îmıDÓıU¹¶ôª˜E;›I?ËíL*…íŸ_…L
Ùd$â+>&V¬áNÓQ™jBV‘8€?5¡`JNŞÔ·25Ñf3qáÉºé÷ÁU<$úQAfÜ½¼E‚
S-îóUöuÍh³ZŒ+×‡QeÍ¥K—›Rk¯5#tø²*?01º(wÕP¾kóò@ÆåH&‰%v•,9*"nú ‡Í¯à*¯T>ip)jUÜ9ü@£¨ÛåAîV2è0îi_U¦j‡KzÕÖ”â pA!C­y “¶¨”âc@€‘—5Qb–äÂ¦8}ê¢@y ñÑ1Ãš*@}ŠD"Ÿ¼”€¯‚(Ñ‹e@XÅDS^©(ÅÀ:h$Èø i€_Š
6ßS©Ts»…²:¨¥Œ²£+Óè£Y_Ç„ÊÑ–«n×Å0‹0´8èªQPY¨$l‡Òª	‹#Ïš|¡§%òëE‹Bˆ%òÇ¢ò¼<Â?ÊC-ø:/—şˆÛ~"m•G‚Ë% eŠ	ÒŠO¦¨+O/ú|àDW¦¡¿dÜDâpo.Híˆ®¾Q0àª…)0Ö¼DNÜú’Š¹l¢	9QÉÕ™™q£í,ª9œûÅäçÏÅbµ7îT6•å6-ÅS`üM9 »N( nÌ.øú"‘¹V£{¨JëUrÊïb+ş>ˆ“º¼ÕÓ’epxİ‘.hQ˜Rr*ƒ§À säµnãÜ¨z-% -6â*ş,PBP<5@>‰êÓ’¡ ^º
”dx8U"(åèşâ‚`kâhŠ ×MPÁÈÆ¨%€°âP%Ãú  aªBšÑhş*(b#«Ø‚µÌØ‰x¢d­f9ª&WìİŒ€ª,GÁ.†B"$0A^ô([ÍQ‹—)ƒNÈŒßØ´ê8ú&rÖ9UËvÛÉxGı<PËš€ xy¨$)P‚cš"COÍîîC	j†É	!‚n|:)7C7$0L‰bp‰€DDÆˆ#òÀA[ªˆJĞ5j
 °=©‘ÛŠ&D?¯%E{ØÔÓØƒ>õ–Ğ{T@­×ä-½ ÕIqAŸ“hÌS^(0s6ãp“îX²‘‡‘´^©ö¬bµ–uÌ¨×¥ÿ ÉVvr-ş«fœ|-e\ÌŠTKÇ’«ùOj!uÕßÅß0?Å å>^h¸wQ@7HĞ¸ä‰„EÇâÊ.µ#Ô8½T­œ"Cr÷£5ÑáM™ü–™mYºhä-%]7ğBFTngEY0>‰€â´öª&"a@È'ü?‚%LrÑ8¢…v÷HòâTµdTã9j±œµ…û –oE¶*ÔCW‚¢uàˆ]b5(©FüG ÉÍ,5Ñ
§Ü¼\j£œ™^±rââa~ÌÑvÙ#UqU‘pb(SEK¶„šñTU€ÿ gT8µù„ıHEè8ıÊÁ ¦¾|”Hh"o@QÑ©7à?™ÖrÖ/DñL˜KçÃŸ§É„ãv<ı©”ÂbàÑüÓ&ÌUÈ—XUà¢ˆ¥àˆbÁ™ p@Ä{1`‚&!¹ó@ºhº* …Ëo5ÕÙh¨¡+}ñ$XŒ}ˆ¸§ØˆŒ¬õEÀÃÔ8d0­=ºé¥PÂµÍªHè¦K»$%N=ºÁBÿ nZ˜# WÁgÀ¬¼Õ¶\Ä.~iáLÖmşÙ½úr4ğuœUò¬ËÛ>uªˆ»s£¨×’…ëV©;RôL·å®\ ´¾:Q Êû€	–Œ%]XñôAvÅOŸ?¹V[xšV#ol¬Öµ‹ŒÕü–ky]d u+r9å¡l™DQk
(Šˆ ¡R‚cÇŠ	 xDGA8µ8øh‡œºbæˆÓ+.ñ”ºGy®;WYÂ±Ô"djµ¬fÖµ¸F"šû×G1ÛŠ	t°t².J •‹Z‘™<ÉÄtâW?7I¨v.O.ğmÔÛ.{Ì:|`"9µBèÄ/—@(¤- h€‘‹y!B$Ê)ˆUV%W˜ö„eZCØª }Úªê‚Qøº€ƒ^J	Pp×TòotD×É1rwhZ“70¸í¾µ×*§{õ\¼İ¼À/W)äx‹àª¾GˆĞİœê¯“>0İ#£­y'ˆÑÜbxàLø§ÁäÏäµäÍÕjŞOS7·Átuf3£è«'ù…¨‰	8Õ‘N	>H
™›ÑÇÅojŠŸzÒ‚­ûz†TfŞ¶ÅDNxª6˜±àPÿ ÅôDÔôğA“ä‚2Å‰öpC!PA£U2Âùkâ ¯sm‰²"í¦Ôµˆ!\ûû™×¡½ñƒ#+µ¬MÇËÑgÂ¬\Ê²_¢$ò¢ÍÑfÕ•{³ïÛ'åÈÓ‰ªÏnn ØóìÕ„”êy®XÇÈ·IÀi)˜ÒÇ› á%±£fëh\+–Kjêºc)qg^ˆå=¸Ñ´–U1PàÕE‰|PHÎŠ(‰r­QDÔğª
ÙWzbyjë\7¬cÆr»zë©\gZë[xê½ÂÕø·YN#Råÿ 4Cù ÏË¹“ãïY±¹X—¡B¹İ]õÚ.íwlÛˆÉkHãµtÖ3 "*Ô¨]í[·—Õö©ƒ#ÂüO4ŒĞ¨±0²§@è¦* ª²©1T:óT&4}½ê	Z¨$jQ¹I¡&Rµu½ä]…ğ¨	Ô¯'w¿‚3Æeêªq\Ş‹¬·4Ÿï[cÆ,G6èÖZxªÍhn7CV‹Q£¹İ˜ZfÅÌ}Ês&µñ¢©†…Œ¹J`ïÏ‚±§GI…"@^ˆòÖ¤+pZe>…!>ÿ T€A0‹Šo4C~@›ØˆMìğE: Şgœ¬ûĞ “Z‰b±:8²ÒG—à‰ƒˆ¸¯¯ª*B4¢™S±}\¡t¿ªG¦¨˜K§Db.VóT
Xñ.ªe–$IñâJ*¼°5(+\Û!*t»D0©sg$ˆ‡æ‰…yìğ¨11ZæÍoú4Yñ‰@;?†ñ	â)ì¶€j/EcW@¿Í¤Á§.L‚c˜ôA0*‚qEK¨E‘pŒ¯0`ÅL®/5Êä¹m2é±jİ²íU½uÃ;UØß i÷.˜r4ó¡òŸ›!•k›Íˆ?Ä˜fĞÆñÖZ'Š'wïåß²¹KµôgËiÊÉ¸%qÀV,É<šø[DìM4L5ŠÔ†-Á§1F…«nj˜Z´fßÕE\·p¢­Bd†u`]F’QLPW»¡ZaVtÒœ |iÁPÀÓğ@ãß¢	‚úúûRìë]q4§£Üö1“s©š«†ÜY®Úò]Yã·§%>¾j'ş<x=ªüIóSß–ƒE~#æ¦;ĞáË©ñŸ5ì×âæ©ñÕù“µ·dÀÓE<*ü­LLK±#¨?‚ÜÑÏnLº<8Ê .²9e³fE‚4QÑP N:!yëÅìQÜH0MíE=Q¢*•Ş€ä£*ÿ :4Q¨³`ä™ çl?ÄFB–ñl2ÑO(oV¿¨1©*yÂQ#¼Ø?Î<“Ê(ğİmKù>jùAb¶dÕÕËr¨!T9 |=È‡µaìDÁ7¨@Æ> mÄê*e	YáD–4I~?mP
X€Ñ¨ƒÙíôÚbéR5E,	€=HÄèŠi^„Kğd\!,‚t ğYÊà3|
Èú)•ÂÍ„E5L
·7ps)-H]™ùÍ‰Šàóò[˜r»2/w}Ûòùx°3àOj™bì&(İ³È7	„ ™c5¿…±JãÈñ%ñocíq‹|/Éš´­mñ UÂİ¼;qáä¢¬GØàÜ“"bÔG—$ùPf`P/“$-1 ('±Ô4E@‹LÕKŠÀ#öôT3úó>(ŸbÄšœ4@â\ô
Ü€–¾…Q^X™¨§4`Ã@<ÑP<*)DR1</ØA¿O¢Ko†½>hˆ·@éğ@H`D0m>ä0±aº(,Ââ=ˆèTTıÈ<PBW¢<y"á~<ÑN.Äñtë‡‰ïE‡%L˜4È‹×DU;×ÄAûQ‘“™Ë^k9FUüÙÕ‹~*eY·ónšõj¢á™{&ôœ	"¢È¡vîDœu—ü˜\*Lå7ë ù”Âà.¬ØÔ]—ñS
»¥¯Ó|Óš1<bİäİlˆ‰¨:¦/¡umaw±G&&¡Y¶ÑœXê¶îáÇÊnè“ø®“yFå›Öï•ÑS1áíD3p}PE©â8¢`ÇÆˆˆÕÅ=JDÃ^7O´óAÅàÃ¦ÄBë²-†>+ w¯ƒÅ*ª‹’4¤O ±äÚpyj]ĞåË  VA¹æÇ¹1óX¶FœæWtX±˜Ï¨ğ¤­yÂÊç2wMÛrŸF4e=$^©å—Ÿ}—öÎÔÎË¹—)jÕ[Å®Xµİm=©nÀ‰0¯6WÍ^&ÑnÔA` LºMZ³bĞz#X?îìÁˆe0Ët³CÚ˜3 û*nÄ5pÏ”÷hoÂŸñ0Ÿ$(÷!4¿æŸ$Öıbz\‰õ0¾qnŞíu	…ò‹v÷Rj©†–¡zÜôÕLEµ
,L(¤}ˆqiš§6òTûÎªˆ5:¢!Ö‚ó*È$'ÁôC)	ÿ êö  ›ù(LH©‰TP pA@ô@ô@™²Åƒ …Â@™€-æv¸YXÿ ïD€ëŸ›®†ùßUó0½¹ÆóUİjm–+RÍî¶.¶Âå°õä¥X”æ"*YEgädkU2Œ»÷õ'Ég*ËÈºIõS*Ì½7¹g*Ï½&w×€LªËã/TÊá^w­øx¦@ûgBæ¦ZÂ»jiÃš¹J®@½B™\+!\€ÈZ<½JÜîãÌ\Ç¸c!§Iä˜Ë;NÚîYÎc(´ôæ¬¶9ŞB³1zØ×UØ?O…Fˆ"G>#ÒÄ£8&j°CÄSÑĞ&àõFœ}¨ôÂ .•FƒŸ%‘^ì	ü’¨VñfdIä³âÖWíbˆ³ëÅiœplÆ!‹hŠãwİ¢y¯teÃ}-­e—ƒÙqq9ÅÏUœ^æÖº½»¶,Xg€y0çâß³‰‰‹°nMaûÖ ı@2˜Kcœİ>¢í8—ÌÈˆÔ8¢–ÉİËni«Ï÷¯¯;60·w®^•ç×ópùí½#‡Ü?Èûò1ÛñnK”˜²çòï{E“—nÓs'êÏ}gl[¢M:¥ù+KŞºO«Ë{Ö]Şíïì²óÜ°jÑÑO‡o]«à[zÚÜûÎáyo7äüyïZÿ óõNŞ_wÆN7›ÄëÁ?Æõüíñ÷îûÆiZİå/	Åşäÿ ÚÖüí}-nmÿ S¾ íÆ&ä­å@k¬ISáä¶bıçöìí6o¯·mÊ6÷Ì–ˆ¤®Câ‹y„òå×¼Ïäã·>_“Õ;sêfÃ½ÆÃÍ‰‘à‘bËZóë}‰:^•İáîöî7ÅCP»=:ï+bÕø\ª˜u”e«LÕ;šª.#Š —µ‚eV5#TDƒëËT‹şHs.Å‚Ó˜êW
Vóñ¦zz¾ÜÕñc!0ñ>«8ÇE#Ñæª*`ı‚ ƒı]µĞQ«ÇÚ0A/@Òâƒ?+LTwv"~ñ)ã*ÒÙ[@³áÕ¬M¼Ú•(šÈ–¶¬Z” %h]é+ònHE‹U•~z¾œVFmû WïQ¬1³7A”¤"½fíš¹MÏ¼vü^ nÆšÕq¼²;kÇ—º}OÛl¸ùÃ¨òm<+Ë]f’9ŒÏ«¸ı7oE<¶\jÉ»õ‡8o½3±ı(Gêş)-óõtÍ\ê·cêÎØJuóWËdÆ­\o©xK€ø?4ó§Œlcwß“ÒàçJ«òŠ5mn–/ a0_@
Üİ‹Ç…«yZ|×Y\¬hã_é¹‘,Ayr³£Ùv)Êx6gqëªë§g8Ğëƒš­¬5‡TÁ›‚nT	0z!éÄ"aÈ C
;-°˜¯’Šˆ%ÈP 4'J	tu(¡œk ½Æ¦¡X{?9§ZÂåÎnİı·àB_İˆº©lÜ¶å‘æ}Åõ§Ï\1ffFŒWÏ;N®_&Ûlyíõ7¸·YJ8äÚp$K?û6üÓëo·w1ıÇp‘v\äúÅÙYÁ=z½Zı=uïÕaàXs&2ç"äûWY®±é×M5ô)îÛf/êœC
Š{í#W“X¡½6ŒwşäO’Ïœs¼ñ{êNİlˆğôSÍÎóße9ıO°ç¦#Â©çYù¶4~©ÚM8:¾u/.Ë¶>©âõtÈ
ø¤Ş¯Ï³cê6Ùy„‹s«Õ>GYöØ½Í³g ç‚×”u×–UÛvqŒÆFÓbş°¹hôŸrm®»Î§'œ“KçjıSŞûvå¼]èœ½¼?p+(Çœ‡ä¸|[iı·3Ùó7ú[i×şÇĞ½µİø;Æ-¬¬+Ñ¹j`ÙoNI³—.z^îÛ.7¢¬z¥æ…T¹Bå\y-(ŸÅ.Šø¢'iâƒ?|İ±öŒ¹cjÍ˜—®H°Œb•s5™©¾óMm¯…~¨ÿ •]Éºî™;waÊ8M™JØÜf:ï^bÆQ€r^êß­é=x·æ[Û¬ô“¿íq»ù1õceº%rµ¹Úÿ ëÊ¶+ëRqÙÚÖçÔñşÍ¬ıï_íóVÄ-wWoÜ³/æÈÁŸÌŸD˜­yrOj_ò4ô›şç·ö§ù+ô¿¹z-âïöq²n ?m›ı‰¹àzØ{Ôÿ #YıÒêÏùs_ïÖëùÇ©`wÛ¸[q®Âı©1Ë2õ‹®ºí®İ«Ñ§6›ÿ m•©k'àøfZ²»,jy($D<êŠwtéªãDÆ¼'@˜ o—Á0<*Åˆ¶ˆa! SÌÉµ‘¢•3€?wnı®¨ÈÁbº0w=ÎÖ/WÌ‹sü;Z‘æİÏõk·)£¨(+…Şú;Iİ_Xr¯™Ã–/Ó­|6­fG•n½é¼çJOvC«Z–Zœ1|œÆNå¸ß“Êä¼*ºÎ(çvgÎöQ%îzÜã‰æ–A¡™åª¾2‡V@Òrö«á"q¯Ì—7Sã‡°İwDrD*Vo_&–'xn¸²\“q©+àjnì6Oª9V']‘Œœ¹ö®WÇYÊõ~Şú‰‰œ#·@v ½I<<Öe±¼MçÙ}»›»üœüÛR±„>;v¦säH:×KwíÛİàßlÜjövF>8Œh hÄ/f10Çh¥×0ueS)‹Óê™\¦2¤ßŠ¹2,2†‡ØQr$oÄ×Ú‚}q4‚uAÇÇŞ¶Ê`?Ÿ%*'ò©Ô #Q.dÙ²rö+…bîÓ‡ˆL8ñW¤fí#‚ß~§ãã	FCŠ05X¼šÇË×å›÷ÕLÌ™N’‘Fªçå¾İº78¹7ü.~õºn$œœ‰F&½.äº³ŠzõzuúºÎıYrpñŞwf%>r.WY‰ÙèÆº²²ûËoÃ1˜qÀ2ÅäbóaÍg}G™2¡ø:Ï•s¼›W;—Ş;¾Q-pÀrg›mïY7w,ëò{—äIñ:«ˆÏˆ2rs)«X ]óT;û>¦œx ”z…bHõe,ÙÜs±¥ı»Òò5YÁã&Óßû–â.NF#‹Ñ:Äë;=#bïü=Ê1µ~`LÑÎ^¦»»éÍîô>ÔîüŞ×ÌnßtÏdœPhAã7ãòş­{±ÍÁ9fgwÕ›İX»ÖŒÜK‚å›±\‡à|”Ó/ÍáãÚö½İİ«Ÿ2oBûÔĞU1æ`*ì†»~`fuj+"¾2ÿ ,~±\ƒı=Ø2ıñÕ¼^¶kgKn8•Ãkç¶=#Á›“ÿ F¿¾¾AĞtèº>‚P“°üĞä
*+/¬\Û7uwOmİí‡yÍÛ®COÛßœcÿ ´’=Ë–ÜZ^ñçßëqosu™ı?ƒÕ{oüªú·°˜[ÎËÇßq¡¬smô]#—Ì¶Ågã³ûv³÷¸ÿ ‹¶¿Ù½ŸŸW±öÇùµ²Üùv»£eËÛ®Nş,†UŸ6ød¯Ÿ,ï&ß¹3ö4ï¬ßò¸ş/jíoòé—vCoî\HäÏLl™~Ú÷—MÖOŸ_û¥×óf}İ'÷Ë§ç‘cwµ“l]±r7mJ±¹	ÄúÅ×]v›v¹zôä×nÖQ£º%k‚Gt‰ş`TLŠ75HW
 Ü-óÕL	Ç6ÙãO4À$r­šè˜íêüL]·ÍEK®ıHH"°;’&x³mX—„½œ÷u´wN)>[Ê1™ˆ˜äüW,šLHÕÜ>Nñ+riÛ˜¯ª]5Û»¦%xßy}ÉÜç<·>ä$j,^şå¯CBq]{us¿$ü^?¿}*ï°Íöã—lWæcK­Çü¥ˆVíó|Òw–8<ı§3Fx·¬Hj.[”}*–_V§&·µŒ¹ãÅé Ëxo!Kø8ğW 3Å?ÓçDÁ¥ˆt1ü
x§]6bKÕ. |GÂKÍ=¯²»§}”a³ì™™F’·fQƒøÊLË¤õqÛìqÏ_Ó«Ó»_üXïıîVîï71ö<Id	ıÆCQ‹D2³vßoí×õèÏÍµşİ^¥~š¡Øó·›òîn»¼*3óš}'»cáŞ³~´Û®÷?‡¢Í7¿ßsøvtÃÄ†<EØj½¤uè%ù† èªP#He ÿ ¶b†–)TÂ`#fA†)„G¦Q-Á0$%.â‹”ãznÀè†X1å¤J‘¬¨U27L\`L¤9­xktï\lp@¸(üS21w‘æ}ÇõNÅ!óÀ< .W;ËÌK¶ı#ËwŸ¨›ã)rD4ë‘`ŞK;^õ×_­o÷W%•»Já73/™qbiì[ÖM^©®švbgwvİ‡ÀHàîmË=¦ãß·îƒ`Z V3k—ÕÌåo{†Y=wHPÆ{³…	Js$È’O5p¦Âª©À.PJ1“7(…Ñ-PKåËÀ.>?Î¹Ğ(9ŸÅ0;—³27íáZ»‘wˆ³*ùŠ+dë=]–Ùş?wÎî@ÇÁù0—óŞ-îÏ·$ººëÇÉ{jë0¿ÄïÊ åîqß^ˆõõ\şM½#´úü—ÙÑíßáY¸Gï÷Û­ÇåÄè\Ÿ‚_­·şQ¿şl–Lgk{ÌŒÆ¤H÷)ÿ Ù}së_ü¦Åş3m›m¿•rÊ¿§Tô‹ZŞIŞ®œ;kÿ sĞûKéÅĞ‘µ~ì±$zú'#&‘ÕYo–Yäúókå¯FÇ¸,Å‰«¿Éøì=İÂÜN¾J|‘©Åj¼·î‚Ÿ,_†¡ûè>ªÎXŸæP&MV¦ñ›Ç^-õÃëVßô÷c½jÅÑw|È†%˜—"r£ú,íÉš÷x¹öÛû5ïsóËrÜsw|ü×qºogf\•ì‹’52—àµ®³YˆíÇÇ4Ök=…HæVíA‡â¨-Y‚ Ç‚›q>GŸ8ü½ˆlÌU©ø ­~(‚F”t\·6òï×¸.öæı¶Ê%À±~}Î&>åÇn6ï]ş¯÷7^¾ó¥ıÏXíÿ òËê¾Î#kt¹‰¾Y2Éµò¯ÿ =º{”øöŸÛµı½\ÿ ÆÛ_íŞşŞ¿õzNÏşgm÷Da¾öõÌyq¹18ş
ç’{U“–w’şNÿ iÿ ';vù92µ9Û¹ğH{U›V¼½ú~n«ë'nä·xÊ>ÙÖñ¿¤Ïäßõ{4,ıWíùë‘(ùÄ²çylïÖ•©;ÖéÎ€~Â¿,<×£ß{a¸HxI_—SÌ|>ò³›såâÏæV¤T'É¯f~YÙÔ`åÎqÈ¹[t›e©åƒÓÅV”·8üë&š„KÕæYøG&a¨I<–0é¥è<§jbP™Š˜thÃs½"'¡Ğ©›_İá^ÿ «óµçLwkØó"DíÛ“ğ ~)oxçtÒ÷Œ\¿¦½£œææİ1/ÿ n€SÇG/ñøı—¾ŠvEßÿ ÅXò‚¸­xëïOñõ÷¿¨qúØÿ ÿ ¬†Œ>)~jøÏzŸãÏü©GèWc½vËd>„Èş)ã=ê?ò¿ªİ¯¢=ƒl­›MÆPêjûßÔ¿[[ŞßÕĞmßO;Gl¦&×‹e¿¢Ô§‹,øqÏCü~)èè±ğvìxôÂ1ˆø-Í¤ífºëÚ/YÉÆŒú!$°*]«Y­Ü1€Cx,â˜k[„LhÊŠYø3œ	¶ZgîUÏhÅù—ì‰ŠÅVr¹c1èõäJ½	‰†×QN`º ­C’¡†<MBqhk_™Ü8˜±- ãŠé„¶G½wİœhJSº!%ÉK¼Œy¼§¸ş®â[3·3zàáE‹v½—ãÛg™îı÷»îF]W¾E’ïj³áîúğë;¹ŞáÅÇyİ»×:ÕÜ­]¤rvs[‡|TÇtr±vµ‹½®k/~ÜrÉê™ˆ<YgKæL¼äI<ÕÁ‚%Šª˜´_’	‹GòA!gƒz¡„…š0ôEÂB×‚?ËôC$ôD3AÔŸ ¥²_oı4ï>äœ?a¶Ü·b_÷ïƒ·‡¹ŞYèé§Ûÿ lËÜşÿ –ò­f÷†gÎ¶'¦'ÏŠá¿5÷ÃÛ¯Ñ½÷¿²>ªí®Òí-6¼K6m@0ˆhÔãštÖaÓ[³·Dÿ j0ò
æ5š1Œ:Z3ÜŒä#Œğ»TÂæ'däF@™‚<(“)dX¹~q`%ñBİ¬MaÅë†#ğIRêòÁ
ùVfã12%—özxôË:ŞùaÛ¬7½rœÛpØYıÃ‰cwzƒ€}ªŞIŠÎœ6×ˆw§×«]½•Oªì\B µN‹ÏÃwÚôzùµââãò½ß÷—vî=å½^İ·’ŸQ?*$¸ˆ<—ÙãÓÆ?/µòÚßw=®¾ÕÕ‘ìÛzµ=ÊªĞ®”D15(nl
¿ŞP*TÁ¸ n˜‘P‚2³åÅ9:kÉ0+3â€f<Hdq7}×¥‰—vßN€L‘ïYÃHé6ÿ ©}Ï‚#—¾|õjºü›zõüÚş¯ÕÚl¿[£fPP¨³…sÇ{ëÉs?îŸ£×û;êŸÓ=îıŒ}Ï#ı¼Ì€nHüyñ7‡ÏéÛõsÛãô¸¿‹êÛÙûvîœ½–ıœŒ+€^³(Ê'ÔqY×‹Ç³qÌfbº«x–íD¢®‰SÁD4Àœ^Eqûşù€)R\VÉo ²ï*2‹!”zX¢œFœ¼ÑP!‰äÀ4'p Ó>*bÛ¹x÷S8Éë/æ˜C¹
È—âILÂİ|}ê‹ 04ªÛŸ7ç	À¬ÙÕ87·İ Ñ”ê–VÕÓ+‘G5sgvsgvş6]¬«bQ.
Ój›†n¨ê4ec62~H­2±fä¡CÁ”V…©	h©ğû2Ú>î¬÷ò%;[\	súÊfÔœW/8İ»·qÜ$gŸ–D]ÌD˜+ÒwuÄÕËå÷E‹=_+ã—=BÍßÙ|ï£Ìî<Ü’Dda§’ÍÍc©İ»t“rd“â˜Y=ZEÀĞÅ™ĞQ2`Háİ#J¦WGgX‘ù)“Çn¸”“®š&Wªñ? ©Q´dÿ Ao$È,6<¹´cl’t}Êdmmÿ M»³t–.İtÂZNQé?$jkví+¼í¯ñãzÜnF{İÿ Ùã½c
ÏÊº.{rû=\S“nÿ Óµ²}/úuÙQû–¡“—n¦åÆœœyÑy¶å™÷{øşŸ»ówú…‰€øÛeˆÚˆ “róíÉµì÷)l½ë{##«"é~&‹Ï‹u–=SjîJÀœnp­VôÙÇ~%ë}Ïoæ|Æ–´+s‘Êğ\	™İFÔ\q¯Üº]Ø×ƒİVÇ{ÅŒMßzÇÈéş:õô€¡¹NOÁ>\ã-İîëwenqºÌ¼¹Âkõ››Fı°‰7¥2ìy.œ|yx0é¡o2Ø4!zçWÏ¹•Íwf×•şßtâ¹€Xh¼üúßoÖä]^‘¾oÛ~EËY8×áÑ#¬$_È…òõÚ¾ÍßÎñÜë¹YÚobdÎì¢zD-L<í:¸oÏÅ¤·1ò‡uî»á¸İ9Ğ»fR‘h^Œ O¤€_kƒ]f½•çû-îçß˜^§™8GªOïğAv  Í§Dµ¥&>¨#Zp}P?Ø HÒ•àÜ=ˆ:[V§%CDëíDXĞ>I…
xÒAğ*`ÚœHp‚yq*—µş ÷Çeßùİ«Ü›aw6­\2³#ÿ ¹¼O±bé+Í¿ÕãÚç¾ó¥{Glÿ šTv“nŞÿ ‡·ïØÑn©ˆKùp2‰>qLo;_ÕÏáæ×ûy3=¶™ıóìİ³şlı<ÜÌ-w.~ÃzZÜ±•>»5Î)ç´ï¯èŸ'6¿İ¦nuÅ{_iıVúsŞQ·{“6rÿ µÑ×ÿ ’}2÷-NMo¯ëÑuû\Vã>7ÛnŸÅÓîqÈ´ãâ‰Ğ­áé³31ÇebËr„Ç†µªS€ÿ Eè¨¤#íA!ôA15:"ln<Ñ¬¨,iàx¨äáQ6É‚ÅÖQÑí¸İ 0Dk]Å…Û}2âV.=ë›níäµ=XÆ+:ô¸t½ó"ßfZnÕ9Ù.[NL„lœg‰éĞóPY“şhÙ­y¢`ïËTw]Ë ›xx÷9 "W?;W?Š¼¶àÌ›OçSÔ¶EÜ~Áî’ß'¤ñw,?‚é8ö¾†o³JÏÒıŞDÆréZ.Ÿõ™v­LO¥‡æG÷‹ÊŒhå?ÇÛÖ®k¨ÅúW¶Kû0œet×PImZªŞ	éz¬Å¸ÏUè}İşŞ%ÉÃXÉ¨Bòô—­uğ­_¢{¬Ë~ÊTá ŞÅ3¯¹8öölcıİ Í“ËFçŞÍL ÙåŒ­F!O“X¿×Ñ±‹ôòğ//´v×ëV­¢[%rGXÔ@åwŸS_ZÛÛ;³¶só%hÊ!Á [Ä®r»ëÁ¦½µXÜ{—gÛ¡òpìÀtøÊòû=zé'¼÷¥û„ü»ĞF4\nov«†Ïß®äM¥pûx­MXòË"àÉ'¦NBÜ˜Lõ&æ5è‘"56;é¾ƒµ÷ØØŒMÎ™5 :.>/v»JRî;ğÈ”ˆ/_5Ÿ¶ÛYİÊEŸ×Y
[Ã†\ùî;–äıgš×‹7l,ÛîË‚"FëHx½?ŠÍÑg ï+Ä¸G¯µsñuœ‘ÓvïÜ³|·h<x%Ìêéq¼Å{Gn÷Î5ûq{€¸_Šôñó>w7ÔövwÌ\ĞP<	^¹¼¯Ÿxl.îÕlFWñàG>W{¶³¼qšmhQÜ{dDuFÏ‘SäÓğkü~Kèòò²;?º>n›€Ä±ÃÙ¿•n„ã(WP8¯>ÜšçËS“êçK™‹¬Ëó¢ É¬…Šúqñ²¹n+Áh×TŠüP7•İPŸß¡@‡šü¬Ã } æè;ş
‡>ÿ C»R¡Ô( m[ “uTX Ö$‚˜–=À.LÊ:‚@B=BäGMÈ—Œâzf1 ÅNé´›L^±ÙlV>§ö¸„v>îÜñ¬Â±±<‰_µåÓw©I¬º<ÿ ãqÏí?•ÃÔ6òóêFM®âÅÃßl†r‰±x·Œhµ›ëÕÓÎ×?ŸóOØ?Ë§ÛŸE½û3d¿-faû‹ ŸWÜó³¼¿³«Ôû¿»'»?ñİÿ >äÿ M˜ŞŒo?.‰´O¦úŞÕÒOªİÃ°”.GõF@‰Â…e¬œq&‡ƒ ˜@X  4yUP@N£^
8?À•S'c)…*6p1ºhíªÊºl<N˜‡Ó‚Ñ¥o¥RÇ)Ü-o*Éêê
mèÅïx“2ˆâ«uhÍŠ¬£9n¨!`™\¥ J-ÈÅ€:£fpt(}‚ÍØî{©üË¯n4bÀÓUëóÒ1åjQî­¾9vñ£×B(şIò±šl¾î•‹½V#¥4<J—’—,»½İL¤/ÔåÅuYò1Õ™s}¿.oK¬—wY0¿µw5ÜlÛãNİÈññ¯µ\³¾·Æ¾ĞÙwİŸ'gÃÉ„D„íÄ¸f¨_ìoá¶+ô?^ùé/à¿ûk„¿@y¾hôøU˜wŞKt€¯ÌÇÇO{¸1a)yOŠ°÷ì…˜uü/+¶¼YyŞıß?ºn;iUË6º|sWŞ×nDˆ\-æ˜­M°æ3»åÀ^g¨ûWI«7zÄ¿¹\—ë5á^¦.ÙgÜÉ"NşgJ+„=«ç¨\‰ÿ EpÔjØÅ9=,eÄ,áÖuYù·pîÇæBL5!Ölu›à]ÇyÛº#)HÂ`<I¬7äsÙË`]Œ>p1 QoÅÆïT†ít	ö«†¼ÀwI$KÀ©ƒÉRîä"2iruf©vÀ¸ûûdHË]VvÓ.šòXë6®øËÂ€„.R«Ïx^½9İ.ÕÇÆPºÍ«“¢¿·“Zí¶Ÿ¯q”ccq·×:¸«7ä×ñŒÎ.-»-î÷Û›¥¡ïËº³³//&ó~ó_‡«Ìş­ıfÇ‡iŞí¾÷ÍÊË.áHW«êñmµëÙò¿å>Çœw]»oàù~Í½	ªûïÇ­J‡<}èP·’á©@¾ôÿ ’)ßÃÉ‘t¯P'áÇŠĞ8òò(4¦Š‡aàiDC“¢	B.\·fÌ%võÙFİ«VÁ”çrg¦1ŒEI‘, Rş+ùÚ¿âÖïŸfÍîùî|NØ¹~"ck±hî¶ÁĞ]"P·	s‹É—ÌßşG\N¯§Çÿ öy&d“óf}Nÿ {ÃéöÕ{ºvlÛ]İÙ¸Ñ3ÌÏÂ¶mfaÀk<ŒbdöÇó\·"Ü@^î}ygJù¼ü|¿_oYãøúÑâÇ¦U¤ƒâ®úİ•‹rÔ7–ªKú
`p6åÓ-TÖŒ @L]´öîÁŒ.À˜LÄJ,AñD²^ı_¡D»Órï¯¡ûNûÜ—ÎNÿ ²çÏc¹¸\ÿ ©“b r¸šB2üŠYÕãâş®¹õÇìÆgéü¤2Ö
=² ‘TJ<&?Š	r ÑŠ$ÿ Šˆ”y{Õ³Ğ.*,lGa¶[·(D…˜ÛjßLBèıëvàe# V%®2ä÷MÊ1´ÍeÁg9®RæåÒbÙùp[lIÄ1m8„@::=[³g¢5Õ;°$¸z(˜ ™Åø/Î%¹pL®_”RÜ'¿ŞÑàüWV{vHgÂSÁ&ñò)•
îé/2=BZ!L¤SÊÎéèbÂBµÕ2¸DæBV„¦Êú'ÃğÈÈ×B)‡ĞßNûÔãör.¼¬ü/àÍûÚt›>¯ünòku¾îÚÙ†`&nŠğuò_{Òï0I…ĞÜİ›•ß¶¡#ıÊRø¹ã¿Åè˜BUóÑjkk7i#†Ëî¹2/#âW¢k‡—mÕ¡¸ÊeÔSó[Ã3`/Ş=FN¬h+—	bïø¨çbpy¸:%¤J0”%PÁfµ{h6¥×lü'_›ut¶2cx_€ 9#‚•Şl¡ºàlùV¥nõ®™±ø‚‹´ÖÎ¯/ß6n“fg¤i]}kÁÉÇ=Û£û@M×•(v4ş’7îŞ¼X´_ŠÖåjÜlÆ³¯Û‚ËÑ¬…võ¨R2®€)šY=ÇÇÌË"6$ÅÖnØ_¯e½ÇhÜv¼S•~ïÃRÜy­k·‘¾›i3\tû¦üg(Ç­W«áËæÿ B—tnSE»²ˆ:±R}}}Y¿{’öcŞ•Ü›Æåé™Ì—$š¯^²NÏ½»\Ñ`:E}«ni9@ã‘âSÔ cQàyñ@œÂ8UüJ¾Ÿr!Ç½¿!D_É°ô(ˆûâx ö¯¡½›“‡z?R·k1·b-vì/Eçrü¾eF'ù`6åÆD‘¢ùßoo?ş¹ÿ Ëù>ßüW×Îó’Î|?Ùéø½ƒ<ß¾.Îä¥)§–¤½Iñ^Ç´œ–G¡v·uÏeË³ncçcefö$£×±ŸÂbb\Æß†Í£—Øúú}¾®Ş“ô|wõã°1>š}Qİûwj‰·°dÆÖí²Ûÿ ëÃÎ_$;–µ18ø@_£×o)—ó-tº[¥ÿ ·§úş:M”æ!NF\ŒË“7$du5o‘ñü”ÀÂËÜ³qöüÉÎË»|\kaçvõÙÂ1$ª–â>¨Ø{ŠOò6/¤[eÑ“cg»+›ö]¹<27¼¦7ÄZ†ö¢|
í$’ååÆvü¿¯éÛõ{]âÜ‹u‚Åy¶…­Ê&½ATÊõ¬øú¼	FV¡™©õAf1<|Ê˜ò„ä¹<5Dµ¤0áÔ(x)¶¹±¥ˆ5sğ±|ªüsóîPB¼JÔ»{'•+¶7¿‚ìúbueqovqouÌ-¶Ö,X ä¹+Ra¹0·"œPÿ _æ‚PŒc®¨zD™ÑP0‰Ô&@§	;Ğª˜~?ÙbZeÀãÁi’œ„'Ğï_j†”¤e 2dHê'E*«‹Ò1é5¹S&7Dc9ª×´·¹[ÀÊÀ‘øÈë¶…MõóÒÇnü7üÚ¸½Á£¦S/WÆ¼o¹¯"Ğİï~£2Î§„kÍ[#t¹7&I4<Ùg.S‘2%tñs»^5}ŠŞÈø÷Ì´ñS²/|á¯ªxµ6"LôğL:g+q„ãÒbjuD«ÖÏÍ8×eiXQ6¤¬O±s®º·!zĞ‰”˜H.Ñ…ºåF0ë'ÅV6ÙÇeÜEÇàüVŞ{sTîÈ[<y-¥Uù§ñZEkù—è¾Ö)„»X|xÜ‘¸hh±µuÓñt»~U¼@nÂ5\<rõÍ°å»»»27)œ[w³Äª÷pñañ~ßÙ»ÜG"(<N«Öù£ÙrŒcW¢Ín/ÜÆùPñe­nMõÀ<›^Z-¹xğäkøº©®Š,iì@ş aR¨_‚_Dåè ^Š‡áêõ:ú qÏíT<8 Zøø õÏ ¿H'õ7~–ë½Ú”;e»÷;•3"?q F£ÖĞSR¹òoâïÃÅçzöŸ¿ğşo¬w>ÛÛ3òÌ§vì0 ¬\KãnÕ«VÇLaF ¾mÚNÏÑñï¼×¦wû7Ù»fô½H¸»€h)ç=^9÷íFí½²Éİ£’n›ãtÚ-Ó«?Ä¯.ÒrmøGÑß›m8±Ú×ÏŸåöécqú­ƒeİ»cÄ³Ü%vw.Äı%}®í~ìÌrßÙşï	Ÿ’îó¨eŞ—Ë‰xÇ_¥"»Uı¥@« ¯ ƒØ¾™àC±ûn÷Õ<È÷ÜÙ]Û;ÔÃµà:r÷?Ëb'åÚ?ı†š.šÇŸ}®z~Ï÷¿³´ü&¿fm™ßÿ »÷D†4¥Y£ñ\$êdx¦õ½&'Gug¸s¬ä–\2×Åï¸H'ŸªIk_¼/H9êµœ3äÔÇî‹óÑé§æ¦Yµ½ºäŞ!É®‹S)å]ÑvDÇ©hÓôDC—F£V·!P-Y6¢GÂÊ,£ÊäZ”à†P•ÁÌUyä[	TæÁØ¨'Ò¥‹¸Th`_ğE;óÑD1U_=d8àşzª;·ZoÃ‚Ö‰:¹TsêÅ(¯÷ğYi(\#ËEr}Ÿ#ö¹Vn¿Ã#Ó&ÿ ‹šÔ¸O\¶îÿ k&q‰&$¸õ^M|v±õ4Ùj7¤c­t\lw”9]'º•d_$:™ÁgÔ«„ÊBLæ¬ˆ,&ÚèS-[ŒˆK€•
7±D	S€ä±]#ZÄ#@b	sàŒ­LÆqY®úƒ‘›+p$Êe¯&ndò%ÑN
-G®k:åÁf4#ŠÔE!zOÀê‰Œ…–#fÛ?Äu+q/El\q'œ¨¥«¦­{œ‡U?Ê×y;—q·‹`cX—ÆGÄÚ¯G™¹xş×,×\G)™ÈÊEÉ^Øø¶ä*ºW¤(òXµÛIÕ£pJ‚…kHrŞª+o9W‡ª¢_.gHÓVğQpŒ£!¨nh†Õ¼xğ*¡=4òP3{KWr|7šÍÊ×QDéN•(PTŸjbúMôJßvÙ±İó“sjìëŸÜÃÂ·!g7r„K	Ê¶1Éÿ ¸İSşZUxùşÔã¾3­ş£õ¾üÓÊôŸ¾¾µØ7İƒbÛp»s¶¬mØ>$¼=»÷É·n ğ3‡Å"k)’äêWÊ¿o7­}éÿ ã:KËş®‹p†d¥~Ùµ~C¬Zº"EÈŠu[¹(È·®ùîÆü=gYü?8}Œ[–åfQˆ™Ğ%÷.+:yK–~&&ß—.KäÛ²ïNE„mÀuJDø
©&;;mÉv½_ ÷çtÏ½ûÛ~îÉÒÜòç<XŸåÅ¶Öìı‘Õ}5ñ’?%É¿×ozæ²/|»tıf‘[¬3µ©ö¬„iîEuNû2ç}w5¢åÿ Øìö-Ï?~İ%ú0öÌQÕ~ñ<Ûà€ã2ÔŒm¶'úı^·‰“õs½mãíSÁìíšÅ¼\8‡gÇølÛ<>mâòŸ"Jén}zÜß_İ=¿×«Ønv¬mB­cü»VÀ…¸° \İ|¢¿ş'Så_FC9×hB1´lvŒ§Á1£g¶a†¾SË{f6Èé¶i¥ø˜™! ‚ÜXßˆ‹†E‘­fä€øŠ52°3!l~¯4UlûÈ=W o÷û¶ÄäajBGJ,ùµ{ü’äÑñjâÌ°rşj˜iÙ˜£ µnZxqAf'Ø  fQL¨üu”™µf“Vº­ 7,Ì¦pŞÅ\“Õ@Ä¿‚ Üêš8 =™‘Gü+£Ä¸rmÄŸÕÃšz½\tÃJôĞ¼•íˆ\‹SPÈ$çíU‰}4}q•»phßz5…Ë"@ }¡F¢õ¡ÕÒxh¦ZÂı®AL˜Z·tF¥„TÊ‡‘Ÿ'…Ë'#6WL¸òFm u—g
“Œ®\ÿ ‡Or¦—ö‘£h¬0²rë¤¹—YmÍ/ßF…%¢xxBşîlÛ$‹ƒ+8òÎüØ_/*yWÉ—+Ù¬Ãäòov¹ {–œÓˆ2 {”«Øq#âáÁb½¥~o*TXóïz‚KNœ•e~4©åâ³krE¼LøF@HS‘\ëÑ¦ÒVµìkxÿ 2Î h›;rqM¦cqè™*.ïœ8„]«èˆz5}È`ª‘ğ@¼ôQ÷ª£J pºóAé_G>˜Ïêñsqİ­‘Ù{<ã-È¹Ì¾>(â[,MEn‘¤i©\9ù~=zw¯gÕúÿ .Ù½§úÃê,¼‹—z†¿äÜµ(NÅùK¢„:„‰`D Ëàí_®âãÿ Ë=?£knÛ²r3ğ£vt°oJÜßşK€?’óÛ-ë2ú:İµŸÓµÿ å?“ªÙvİÏjÈ|ñ»íìòÅs 	ı#ÁŠé®¶_é¹Î¼Úrkõğ¾ıõşn“'*ÔålÜ„:Ã1ÒbÜ
ôy>tÖú<güƒúİì«ûãß¸Ä°lt”1C~âéãú~ø•èú³äß>š¼?òââÇıÛôı·ıŸ˜D,`=Ëí?4Ï½pİ¸fô…‹ D€Î\[RM ‰<“%èöÍÖÎ'ÓnÍ‡Ó»wmÿ æ[çÈÜ»æP˜3±l™…µ;ÿ  ?:øş²ÑuÖ<Öù\~¿í?Şş/xú?—Ú½™Ú66û™å¼çË÷›½àÅïH4-ƒÊÜ~ê³nkÓ4ñéêôË=ÇÛù äZ Ô
tö1!Ÿ²Ü?®Ùñp§DÆ£ÂöÏF•ºëQ¢tOVc‘´Ä9•¿
„èxÁF~Õ[å¨C/÷Í¦ßıØT^\îÍ¢Ñ?ŞªâŠWûÿ i´)tæŒİ™Y_Sq"âÜÇŞ¡—7¹}KË˜#™y)o²uË“¿ÜİÕŸsàİÜºç|Û×[êÖÚ·ÓP96É—EÏ³¬²;½¯¹í0A„† Ñnmí~ß½âŞ¦bµôZÊ7ñólÍšI“WƒjåT\·p5P©Æ´@Ÿƒ¨?râj­T†·uÉ‰«E»±ˆ•|*¡•yZ#_E0¡]·&à€"ƒÃ‚Š-¢õçø ÚÛ²¹Äj$g’f7Åq³^7ºx¯éÊ—TœğQÒâ_—â©aãJ‚‹,–>-avÑ‹>§òY­-Ú¹†uìRÌº½xòTÊµíØ€Ğ5>õFşTÜ’ÇåL´máˆ³‡<üÔËsQçŒĞføHû”ËXÖdZÜ¿r˜Uİ±£kDŸˆèÍ§G7k3yÔºåÂj§•Œ"$Eé­rÛG;•t™ğUéÖ>g&İpªçĞó]O¯ä‚Î=½k¢ÍtÖ5`Öíøğe™ÖºÛ€.LU5]j¥r÷%›U\’IsU0©BDy%Y[›fd­ƒ^$.Vuz´Û 9¸d8Õw=û‚õê«$å¼ªúqUKÁ@ÿ ¹¦¨‡ûø uFïgv–íß=ÃÛ»?Ávèù¹™’V±1 @¹~ç€Ò1şi0Yßy¦¾U×‹Šòmãdl›Vií»ÛxıNŞ:`.|rœäG]ù“­Ë’ø¦}4eğy96Ûkkõ|ë¬×ÑÑâüÜ€?ydÄQœAép}Ë}Ş¯;»[.5Ş©ZùdI„ÄzºHÒ¶æãŞ§Œ­üÖt¿ëöp'ÓğuHÈS“š›0³–^îW»»×nÙ6øn›ÎHÇÆÇê•ÙÈ‚HˆĞæ”´ŒV'Ÿ%šëÖºI§»íq«âşøïL¾öîkûæá?•ó ³·`’æÎ,	è€dTÛY/Ó}o¯ñi5}ÿ 7â>ßÙÛìrİïìĞ¶Ÿ§¿Q;®q±Û=§»îQ5•Ûxw-Zóù—„ ßú—{‰ŞÈã8·¾MØÿ Ãÿ «›•¸ŞŞ/í=»nUéÊÉ–]ğÿ Õo2 øu®W—Iï]g×Úû=/·?Â}†Ğ…şîîì­ÏŒñv{Á²ş[ß2ç°ÊóûF§×÷¯eíO¡?H»>åœ›´ğîgØ1­Ã<K;,NÄºï™ AĞˆ…Æïµõuœ:OO×«´½Ú]—¸Ü»wpíÍ³*õéß½{
ÄîNr5”äcÔI:’Rm}ÙÛ‡Oügèâ»—üwúa¾[Í·#¶³¤FNÏvP¶$xËá•¹yQu›×–ıYÿ mºÿ ÑòŸÔ¾Ùúô‡v·‰»^ışË›)´ïØÂQÇÉ©·8—6¯D~«døÄºé¾\q¶·Çn—÷_ÉËXú™ÜV[û³-­JéåW¡kê×pÂsn%ÊyÓfWû€†ù’÷§•LQãõO¹n†—´§ËãF‡÷>EäÇ]S;5jÎÿ Üyduİvâx¤–-¼+[ÆIåÒCü@>‰âM#¬Úö·gtÈéªÖ"øÈíö¾ß±hÁÏ¬àu8{+¶<™LäËbÏmâHÓoS¢ehv†$é€ğe›"â"{4@½™Jš‹>›£wÅ/fé hTºÓ¬Şá½a.ÙëúVsg¡åbíïùM«s·âAe<áç8½Ñ…>±~!êºM¢æ4¬î˜÷™¦Í\«òK3FĞÜhi§¢İŒÆ\bbD´15sÁe¤¤LCÕTCÆ}G“ëMÂYt8áè”Š‘b\¤Qb ÒÒ ¹‡8
š^){.½,kÆô Ô;¿‚ùø}IF·v2ÓÔ)c¤¢\½€	rtòIÔ£'?‚a¸”nËGVUf7›ÀiZ,å¸y]›, ­9]›‡'šdÂVlê®Zño`ˆ†åá«®v¶Ñ‰«P~+9n•~€
rUHäC¨ÑV.X;ŞqÏ–%Më¬qßv|.ôÛqÅk	–fëÑl‘Õ—}5yy¹q0ç%#"I+Òùv¢Ü•ŒJ,hbC¨|ç]ô‹7Á…‹Z³Éİ›zíhµk’»¹/R naPñ}jÌ¥X¿cáãÉIÎ M«£K_àµ¯İÄ o=QÆ¼}Š…®´â pt*«S·»{{îİë·;wY»ÆlºlÙ„!ü×nÏH[€¬¤~ô¶I›Ò7¦—{ˆûo°şì_K{oıŸÿ Ëİoµíãx•±	åŞ@úZ¶ä[ĞTÔ¯ÍÍw¿ƒô_‚k$§kÆıåâOG@	q7‰é£3¯6½^íìÖ;[\·ŒÏ]ü.çCŞjñ^N½bµüLë’ùXöã~U@t·7z‹­½µßu·
9“Ü[Œ.gãmÖäCÈu_˜,=é>¶{×Oóøuí.ß¹Ìïã?fwNvoxoï‡·ÄŒ}¦ÅÈ`b²/;“6Ä®NFƒõİõäáÖÍdÍõ½_;î}¯ò6–ëÒv™¶~×·~›ı=ìŒxØí>ÙÛ¶Öø¥z#{"Rç+×ºîÿ ©k““mû×—[gn<Îá¸arôçúbIaäŸ1ŞiÑ~³ŠZå`ÅÇ*>«7’G]x.İ–ñ7;`JĞ@&\A:(ÅY¼©·×ºè›J±<ÂÖXğ!‘jL€œ¿A<|
²³t¸X…ß˜:	®Eo.~,Nèíí—º¶|¾×î\xäl»˜ùWâU›ßö²-åœ%PBÏ•Öäß†réãë;>İ¾Ÿeì{¾á±æÀO3mÈ¹‹v`RfÙa1á Òõ_F\Ì¾lí×¸ìê€-—äËJµo²dü¿ra˜İ• [åáM¾+Ñ½·öiD4áÁ0·nìè†{n|ˆê¶ş×·lí±äÊå.ÅDj*(Ê3[ø›I‹4X ÚÆÛÌ(ÚT–PiÙ²CôD^·áUb?¥ĞàuŠ;ıQUA¿³a]‰-Å¼BÎ%G7»væÕn2œ-±ı%‹%~-k6kêæ0¶ıæ2•›Æ8àü0‘z-Îó^Kèüè…»fËÈÆ¡Æ¾ÄzYR«0h°Ğ7I‘}9%P£2à
Fw‰‡G4È„K7½A.²ÙÑV1dgpDsSkÑuîÕ †“/#ßŒú’=ÒçÎµ?$ÂNµrİÏ„^Õ‡¢Qí‘3Ì~­Å»XıDU–-t“"NÜ`:xG‚‹Œ+Ïá<9$°äºR5±åÓØ¬6¸.àJ,ÿ Ç¢Z}'£ÑjD®Gy“_p|¸/F‘âäRıËZ&Z€ºxõcÏ&ô®Ü$—zµ˜|ÍöÍÁi„…|Â	}iä£Kø·ŸE›u¸K/$\Ó—ÜŞÊÍ%Ë­93*üĞÜƒ P‹±4ö­I„´íÄh«%â¸øsD/³"‘æ	Ù”R|P^ÙöÇÜñ¶m¦Ğ½¸eÈÆÔdz-Â1S¹r_Ënø¥.M¶šÌŞÑ¾>=·Úk¯wÔ}ƒcaúyƒ‡·ÀÈÏÉ¹¾oF-{2è šÂÄ+òíê5+âssíÉsé;OõêıOÔ×\z»Œ}Ó+xœ‰~™\”ú›ƒ hæ¼ó6õzñ4ç·,#ğµÙ»·:ø.Úb<œ×kÕ¿“ÜcıˆÜ‡@şh†SUÚï#É8ïrÀİát“„ ä2³’&üm‹{ŒŒ5×Fªß›…ã=¼ù~*
óWÉ«Æ1º.[&2ªeœaÎî²7ÍØÌ°¬…Æ¹®[jöi¿L9½Ôß·ñ?,dFñaí\6•îâ’ŞÀl9Yöî7á/–+W “G<kÁqÖÙ^ıøõºæwv·p.ŒX	NèbÖ• ¶„jïy1pù×ëæyQs€½Œe†b¶ÜëáèWKsmgÈaî†BådÎyÑ]wc“‹š–nÚ‰& Š.º]¥>ºÙ³É{¯bÃŞ»§sÏ‡I7nDHó” "~åôø³á#—¦ûcİJ×dDÖ0‘e×«W,voC=¡æ™2Ñ³Ú6ÁÀ?’e–Õ¶ü±ìL+½Ñú`†kFÆÑÒß-;x±A¡gDèÍB‚Ü-€4P‹Sš‰‘£NHWíYR–Š–ãº¥İòÔZD+5µÊòÉÙBîá¸dĞn'Òiîãyv GªôÌåâVä‘ÈaÄPzxª¯Ê;9³¤\ñj¯.^ü+Nì¥)tÁŸŠ.$»Jj¢”ºC€h‘:
Â!Üª YëÇEcbD½ê^Íkİ|åEÙéÇŠóaì”×/É˜F]<Ø¤Âİ¢V&9ıÉZÕp\ X®ñgô@û{=£r¯Ç+¤5à¹aÖP/æ° zsVj—`axÎ²õ/EpJ½fğ ¯šÍ’®ÛÊ:×AÍg‘?uñuÁäSÎˆÔøø­MSÉC#8‚ÃSüæ®wg=¹dÆw5©^cÍÉ¼P¹(0:®’8ífrÆ¸Ié9.ñà°#Äæª#Æ¥8—¹#qƒq*arFFTL.PobA 9ÕPñ‰Ğ•»p W]¤KFĞÓAÍi’ÕÚªò©D$
š{P/°E!áê¨\ƒ öï¤}µ,M‚îırÑÛ×öìÜ40Á·*WeñÈ ¾gÛäÍñôŸÅ÷~‡×_+Ş½lù]›tĞ‚Á¹ø¯›_b[…­¿y…«·-Bå-Ë§á Q«_3ÑÖölÚî;À˜BçÃ£ÀñXòs±fŞé9Ê3‘&<–G_¶îíÂÙphºë³Í¶¶º,lÛ“écÑ¥v›8]c^ÍÖ5,I¬¹q±¥‘1/ÕZø®±çÏ\zÇX.èúÕJë­Ã3#g7TŒ´jrjªÅÕèÓŸcm?.=2€'ú¢9ëíYœk~Âõ­¦Ë‹‘æYPhxùp+_\¯Ø½”ûšÎF>Ës?Ù»ûyÆåñXÙ‰Í‡.>šßŸ_yy1}\~&éócóA/«ÑŠók^ş^<ttûV6V|ctx
L¸ê—}Y{øx®ıû>?ØûY?»ø>Ë€™²zÉ$$šºú˜ö|_sGcÍÄı'ª#ŸÍ‹2µl_´@¿eÇIç=S-t”z#â¯J¹‹¶ñ¬²<8&áŒÍD@h	1( ·ÀsA.†FrŒî[²:®Ì@x«†”ÎóhËåØ™æ’g·W?’zuİüœÔzéâÍÚÔÎ$KË¨ø­I#
Va
F,´ÅêÅV7Q¤€Aù1nDGª†’ŠòÇÑFd–j‚¼ÆµY‘
UĞwÉ êŠ &U}üT_Ó]›¸;ÓkÚsƒâß™ù Ğ|!Ã«5ò²S=gæûÏÒÂÇ„_ËŠ*Uøxã­º¥™ôï°å+Å˜Ñ%¯‹Lc6×Ùã]İôskµzæFÓ1— DÑbıojë­ü^_ºv†nÜäO¨F•\/ÑÓÍÎ\½sf78Xº/ÈCt‹2ÅãnsDe¸BZúià|²o>Ø«ÕK¥nrÁ£¹ÀÕä8©áZù¢cuâÊ|ió%-İÀ`IO/4yù~˜—j·4bó/÷šD·¹¬s¼›+ÜÛ3fz¥Çšé#•›På¶äñªb£ò/Ø…jVl¦ùÖÉköİõ+YÏ£™~Ç =‹½<ôVI{VzwfÍ¶­ÇæÀUáª·[­Pœ%nDN&ˆ!–YEÏ¢*BGŠJ$Pj.VmF<
² §¡
²\|5@Å>ê¼R*!W½©Û›WtïX{+ƒ•7Èº­cÂ·n4héâË;ï4Öí}x¸îûHú³Æ&$-aâDGÜ,Y´éµ Ğğ_}­ë{¿Q¦¸˜CwÉ²1ä"LcE€®NÓ¥q¶.ÜÛr¤ÏTF„5«ònâšuvÓìë•\®Âõá>«R`x:ÌnGM±ådÂ#æ—<"s…ÛXíöÜ™Ê“vÔò]u¯>úGK˜DÄdD¡Àrğ]ô¯&ËW¢Ôø^­Ìò^™^; ËÌÈ´Ğ‰çáâTµ×M%;ÆM°íõDñûÖ>F¾WìîñœbDj#¤—MwË…á°iåˆ¡¦ 3•»S]-Şèc1øeI=ATÉgÊ5ñæ‰Û·nô³°ğ`ÏPµ"ejÜ¿ı¸ »qM-íÕÃíróY×n±l‹ 8p½Ï’–=|ubèáÙAU@Ó*Ät•1)mRè‘
a<a¾Vm­*ªâ¤3/Cş¥¿VO$ÈÎ±3ñ|%\Ã1j„ß¢`«…C&W-Y¹8”C†H³?È­â]Ù›ƒ¿Øı¶ß…—wöğ¤úmÌÅå#¡:®šbÌíÕó¸îüšÍö¹ü¿ƒèÊú“Ú]Í¶dCç02³ptÇÑu½³éø=’zôwänGªÜœZ5–ğÊ¹hÖ£’3aã™jí	i…\¬"çJƒÅV0aMhDĞ;{còFÔ¾Éy@ò¸ÌxñLŠ÷.~y¨¡»±:ıÈ'z	™hş~ÿ r¿éÕÉâ÷­Â8pGŠÖ·$™¯j»õsêcv@D•r×‹?/¾7	—ùÒñ/T»9eäwVãxó¥Zê§šø9íÃtÏÈ$’ë7zé%rÙ[6N\ÌŒ>+åq¡Ú™rà_—Pñv^y •p1?üt5ŒdO&S	à”{3uyZ‘.Ÿ™Š»c¶¥á!À–¢b70ŞÛûok,. djÇø¥²êè¬öÒÃ  §‹]ãÚøp‰0¶<4QTò»~Àtæˆçóv8Äˆ¿‚&ænÓ0ÿ 	}]Vn++o¹^,9­Ç·±Ì	¡ÁYÕÊÂ³—!ò®pà¬ÌìÎ1Ù«cw³||­Ë7§TEVüıæZÏ¼Èßì[.à(âÜ?öîV/ÉOé½®?6z{ãóTÌìíó°³û«×câ§’·M§¢İvŸ§V%Ës´~]Ø˜Lk†>õ†%”ƒêìª§×#Åü °ÉHz«XÎÜƒıè$¼ÑÕ£ jú H¯[ú;µÎÖ6vó"mÏ2_¶µ!Còm—¡ŸÜ¾wÜß¶¾Ï¯ô4Ä»W¬cŞùTÔµj]|ºû:«näNÔƒ±Ü³*±01grè |8º»Vã¬ÅÚî\ˆ
6•\nÎ5¢)	?ÉLµ—Gƒ´Æ 9¨¨mYYO7G·Øı»u¹âºjáÉsÙ«hFu¶hõà|—}\-³»_ä€“ÔTreÚ^Z$J#¬;>+YcÅòÃ ‡ä†D³o¦]lÍ¯™âµ«×=©èïá§x-UÓ¤g_»r	¡H“Åpµêã“nÍ-›q"FÙ•twzñ\{õoŸ†]rëÙ€^+í?$MÄëø m ö„BÃ(Âj7¿šmÂb QZæ™ÔE¼’¢­ÌŸŠ!IÆ3rór°£.¯îA‹×‚ÔÌN±ñÇ×ÕÇÍß²;‡iïW&"-ÔG8•×§§OÁtšæëùááx;öï±å‹¸yÅ¿ã¤š}Ş‹96Ò^ï{ú{şOn{_ÉÂîWÈÆK?æ×Ú·6÷ıßÉÆëuìúkµ¾¥v¿wãÂæİ›nW¦öd@Ÿä}ñ™•›Jè®Ùêp.9Çš‹b½¼¼›bò~-,lÛ7˜;OF4Fp¸yğ>ÄXüŒ‰éî¼ ›·Ü‚ìâİĞMÙ‹ÿ ª™}åˆ’GK’tæƒ½íMºåŒœßÜ¹Vğ);7¬uCõÍAdhXíg¨üÔÀ±k·¯£4L.Z6;^E‰sÁ•ñYZ»RÙ €}UÂ\.Úíql¸¡	…•{a¶Ğ)”lböı¢Ã 0ÖŠäÎÖ»_lM°\hÁSÊÄ¥Øû}×²+Å–q·º†GÓ;µ´:JxÆsY?L·{ğï@àÊb¦k'eîmµásÜ8‡ RÆ§&Ñs*mÓ“jVä4à¤™tœ!g'IN£Å&f‘±‰Æ‘E^Å¹`æöìH“ÃNJ#—Ìí™9è•dfá“w·oÁåÑE¬9•šè”IŠu\:İ—dÃÈ”a“dH=N…Yøº½iúmg21¹µæÜÆ¹Â$õGŞ·4“µ±Âë¬¹–ëÓé&ù+'÷»f6óë¶:.·º«w7¼›~êç·•ï&ÿ º¼ß{úK·[œ¾Tòv\şœËr6Ÿ—RÅšv–ëÿ »ù±å®qm×ÿ tÿ w¹ı7î­ºı¬hçâûøryj¥ãÚLã§áÕ¿êöı:Ç)vÕË7/ÂV®‚ÆÜâc'ò+å&Òö0¦š¢§³z¹H õP™# Ñ:pTI¨H,Nä£nØ{“"ñHôyBLô})Û[t6­¯nÇ‡\1mFÓ`|FœäMWÂäßÊÛîı7:Èè­r7Èhú–½‘›–.d4"+¡päº²5†ïmì¹(ÊqĞøËİZÎ‹°[6ã[š8ŞN«'f·‡¦ƒ˜¡SÂ,Ü{X1ƒ1px3'‚ù,ÆÁ‹ĞhWI0ÅÙoÂœ‰Z[wiZhKÔğàºÆ/Uƒ >(— UÅ
ÓNrÈ‚ÔBZË8ÕÃÖ@éäµ+™©JBDÇùˆÔjUÊá‘~İé‚mÃªë±ãê]y÷Íìú<vNı–{kkÌ†åÕ”­Ü RV¸8ïœÊıß³§Ãqİè$/¸ür=(#Ğ‰€º[É0NP!"<¸ ˜©d	¬è!8uDh3²öëw¢A…S;î¦»vójbäGIjªHùÏ¿ÿ ÇÌ¸|Ì¾=`9 
¬ÖúWo=©¾vıù[È±#–vV[Æ~ÙÜ{ÖÃ–2¶¬™ãÎ%úA=.9Å_+.cÒmÕôG`”–ßX}ÓlÜ°Z?¹‰2éáSR=]wœ’÷ıßï?“•×m{¯Øú[¶;ÿ µ{Ãİí³2ÜîL…Ã¹ğú-YÓ3ı#2ÿ ¯õ‡G,vi@õê:É-dß±©ê€àQ›“r™:^<½¦QÓÓš	Ãô‹ÄüX†Ù™?Ól’uN¢Í½ƒp»¥²Y041û7rºCÀƒÆ¬”Ã£Ú;ìg^yTQ•ÃÑöşÛé„cÓÒ"8x+‡L·ñ¶g‹ıé„ËRÖÅnZQW¬ìP·R5¡â‚ô6ûp` ©a·BtèõòQÿ j 8fäR™N-.šy,·+Gx°HÍkXÇƒÔ-%«±çÂº£6®ZÇŠ†W!‡Éi=®ÍññÛŒŸÁ2™dçöFÑ›.cEÏ€t\¹-ËéÂg…9Y Á—%¸ı5î<N,ÅèGH‘VSªË\¾^Û¼aHÇpÀœb(g áLÆ¾OugoÈ§èŸh_Õ\F¼²RØ,İn–é4	Š©ÚìÑ9ü1~>+QÓØ±Œã& ê@ğZÃ5è›&Àpºx¶Š±—olÄŠ3W¶Í·q²lçâÚ¿l†"äDö¥­fú¸İÓè¯kfÌäm7/ìùz‰âÍ OŒ‚³$—32ş^\ëoàà;›èoqÎÌÅì=¿º1E".ÇöÙmá8ÑÖí·¼›~ëú­»úÉ¿î¿¬xŸq}!Ø±/wÿ Ü;O,Ò6óíŒ2|.ÅØz®wÇŞëùöıYù5-ºßı]gë^çôŸ¼°lË3Şõ·Æ¿ºÚîÓÌÀ|A.›wÆgáÕÛÇlgó¬qwmÎÅÓbı¹Y¿JİÈ˜Ly‰ V%Ë2ËÙ#Í(ÜœM}ª±ñå¹÷^×8½»wNEßù,§/âËŸ6Ş:Zô}}<¹#é<,›VáÒâ%ø2ø?K¬iYÈ#¤
èü|Bæè¿g1ø¥
kâ¦WhÈ6È¶$Åg8[®]†-ùN1ê'ÃJ®²åÎé†Œm<Z§™â·†2yXŒ"ı#™mV°™ÄH!”3€ÙÖ¼Š†rµ)[Yn\1Š³nçP$Ì€x=¼™Ú§!!XğmóL ‘ÉùrŒL¸è|Vò=-’C3P
Û˜”ap*MFIÏGE·]Ç@Ò`³ğ¯éÓlWƒ›[´­ƒ5ï|£úóA5t í¡â–@àObè‰µä‚B1æ‚d8<BcéÅ@9[Œèê¢µÌW&FvV×näH”}UWİM6-îÕÈäãDJ@ü@*Ë‡Î}ùş9Jæ^ÒH qSt¯ß;7¸;rì¡“bSµú€>ô–Keî=ÓbÊ[N]Ì,ˆŸ‹ ü%¿ª:.šŞ¹®’şo »ü Üvï“…İvúì¸ï-¼¢Ú<ãR=ë·”½ÿ wòşNW[;vÿ ^ŸÉô.Õ¾ÊÜp-gG:Ù¢öşL„ú¼ SKzÎ¬]äÿ £á,NÍ7®×S¯{û4íı;³t<GL¹Å<IbRúu¹Øøñ‡XU›,_ÈKN~ß!ûŒ9Hæä¯™C·Ïl‘„/Z“×¨tŸU¿)Yu˜;~Ûy…™Å	2Ò7ñ»~É‘ˆé:ˆÔ³³tYÂ•¦¬l4£^lê6ñc* ÕĞªdXàÀ8°õC#Ã«»0ş
.V¡ˆà<tÕÂ"Ì0Ühş(k`ãË‚‚å¬(tÁS+l‰n
²5œ ˜¼B©–¼qğ’•9¨""ºqä€¢Å|b`UˆaE6àhUBe¬AÇ$EL‹"&7,ÂCÄÊåÊnÿ Kû{syK0™¯TI÷)ˆeÇnF®[&{fdàu•B`ü˜—{+»ö‰uF&Ô£Zy«“6…¾n;lºs°å ?SÄµ–n³lî­¯!£pü¹ñXeÖàçâ^ä]Œ‰­WØ´z€>Â³E»fL\µ3íàˆ-ìlLër³›o"É(]ˆœO¡
æ£…İş†öévY›m‹İ¿¹H’2ö«²Ç.x˜„û|g§Kø9üzË¦ş:îÏ¡]å;f=O~mñ}ÚÈÃÜ:áÉ´|JÖmï¿>ÿ ªİ¹=q¿çßõx/uı%í¾ü­îx»ÏÓüãHÇq±-Ëi”¿áÈ´òŒVq?ûÒrëœ\ë³õïü\VÒôÇÇ–~Ëk¹ö°:¿y°ßcGœ¬†»ıªx×i›Û¯å×ş¿¹gé¦Ü)nû†M™ÙÌ´a…w¡+w ÿ ÁŒ€!Øâû72GÑúX¶×£m×.åİ‹~AÈ¯™´ÃíèôşİÙ®N”ƒ½Båc®×ÂÖÀfP5mteŸ|ÚØ›=›@J'‹~U³‰‹jİO«­a­­KP…<]\(·1á×L1•¸lIãì\ësl«ÎÈ0bğ+º›¦!©ñGP@(–o«£€§ˆâ«=Ğ…àD„˜˜ÔkPµµô§&0¯P5<¹%«?®Ó¸Nå¿“‘ÕJ5M7päã’ôXÈ•ÉÈĞŠĞÕ¿%¼³ªîqµzçúI}jm„¼y™wg–ã8Ô/§¥Ì|>]|vK¢>‹nh˜‹Ÿ5QÍy gqâÚŒ3 pãJ„C‚IüĞ'.íN>SW‘0cj\Ğxğ˜Ñı¹;U« ƒÇZ"åÀ÷WÓ]«{³rİÜxui0©L56¯›> ÿ l›™8K»õ[L5™^½vıÛ×e‹˜ŸÖvò)œ%ÖşÅ]Ÿ2å¼È3•£Õ.—À]5½\wÖ^ï¦±û^0>,¹;5ìöüGTª©…Ë{@!‚'U¸ìd »n2ğ!õLC5ÄÙ3cıÌqÀÇø¬xGO9ëy?K>Q2Û2¥f\ı‚Î,^Šì½å²‘—f54,¯•<*Ş'wÜÅ†é‰rÑªR‰õ¯8˜u[wpl»€øoF$ğ‘çÁ\¦6¬cße based off of range
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
            end:VçG‰àª,Ç†:„4 K„íY„¿PªÂ‰c9şJ&G†+PŠq(efĞãtaŒ8Pñ,BÔã¨~EhÙŒØVA8cÆ?©Šü«$€7È.í¢	‹…<<LY¹ø¢¤-Ëù†œP#f2~cšË5,ô¨U–¸¡B"FÅ‰ocÂà4..\æãôçbÍÆÏÉ¸š!2˜o#é¦áŠz¶œé4ŒÏ%r` {ëb-rÈ·L~0Ê¤Ì_Æú‰•`ˆî8&'ù¥aL®‡¿v“;ÇG…ÁÓU,kÊ:¼=Ë&"x×¡v?ğ~ä;´áv5##<XtğÑ^ùYgc2Ô/ãH4íİˆœñ&RŞ˜½9ŞJ~‡æeOp"]±½’Oû†Ç‘,Â\ÌağŸbÜÒíÖG+Ã/i‡–wfË´cNÖ>_ußî«vb~Vnm¸ZË…·¥«³¶ÌmD¥UË“‡m»½Üc~-l½Y»^ãÚ¸ •²Ñ,\•ú™ztûûåì­¾vday6âX@:qÉ·ÓÛ_G£_·µz¿ô¬\ŒÁäW–ñáß^lŠvÈ[/*.wWy¾C–]ˆcÍL56!dÀX„Á”­ÈÀÖ£UfÄî@\¬xğKz3²-jp¬Xôkr­wà.|üVb^¨Ÿ‰¤ ézøy-³"uœ·eÀWGL@«ğ0aÍL¤n!çr$ôÆ¤£ó[Ö¹ò{.Æè™hX.‘Œ$1r~dgÃQèµâé®ò:qo}6läm†"ÜaÓrÔøÉİ}ø¾Ûë¿CÇ¸7<V–â³‡Ä£/"î?rí7È‰½òåÄL5}S0ÃFŞM‹ÀJÕØÜPF}BÜÅ9ª†n`úC7Şº§DÒ=-ˆ† so>(R:8 ùQÆê8ŠQêĞ‡üB JËş¡øª(em–¯‚AòTqÿ Ó‡zêıŞ,I˜/  5Q©\æßô+±¶ì‘“®ÕÜ€\Jqãâ˜nìÏPÉÇ’1‘cµC…à‹‘£‚`z\(e!i@XâËXÇÉ8ÙjL‚¹L,CßUj=ª\U–Ä2v=».=ñ­İŒ¹Ä9Xğùû¹Üï¦;`3³nx—N’´X,øØÔÚV5ÎÃîm¬™m;‡Ï€¬a:3c^3Ñ+ÿ tlÿ Ûİöë—-Š€á¹ÑnnÍí»¾vL #zGæ†3U¹YÆ.5Ü¸õâŞ…ÇĞD>
²¹"Í§%‹bQ'«Ø¨³	XÇU«Q‡Ç‹¢ˆfsÏ‚ÊdğTÈqµ# c2c¨V0¹jj\(Ğ½’ÇÚ¢‹(–!cêÅ¾[ê¾L	4ø†ˆ%Ğ ÒˆÂ$Ö#Ñ|Ao•†øe
%ŠóÅ¶]¨U–!>utYT36]¿(tåbBà<DC¡İÏf}<ØóZÇ‘:j+àUÉˆÃ»ôÛ}Û¥+Û>i TF0$ùh™Œx‚;‹êmË§6ÁÊÆ¢õ²Quk9¾ÿ «omúÃ·Ì‹{İ{|ei®Eşô²µm“³™ïO¬rÈ‘ÁØz¬@‚'v`uÔpä»i¬“7­g3¿w‹nÛ–MÒr/ÎWo™u™ãÅoÊÒ[oVUÌÓ‘’>9>¼ù¬³{¥ƒ‰ĞOÏ¦\ĞÚ®[µDü¿†q/A†‹~T–º¾ßï>ãÙ©XÊ9#ÿ jáz?=Bç¿›÷ú}‹­ëÕíŸõz„,æ½Œ£ü“:‘È¯Ëõ.½gW¿O³+º„qïÇ®Ô<x.¸{uß!İÆã XÃ¤ª³Çé¯©Y±¹P”K‡LD/ÛŒâãSÉf®·ë˜ñbkğ¬ºäæ00ˆêAæ™eFpŒ&ã×“…›İ×9Š¹'¬°$Q›—%1”ƒáÚ»b27A™ó¯§Ó]pã½—³O[„Ä®çËUÚaÎÛcrÎã‡˜˜¸ñÔxWy´y®»WS¶Ş·+ ´%P9/oèù¼óªÙ1c!ÈÔ.Ï:VÏµe†¿æ{Âb«½Ÿb«oË¹Œxpê`ö]×·ÿ Ò½»C‡ój½Pßù>véÜ°'gS&ñ»£gÉ"?;åKúnQ\[W­_U«‘¹p*¢~ïb?4‰}Èj¸¯a§<‘	ˆ,ÂÕ_Š"$7é$>®‚2§)6ú©!Õ÷ªq­™÷ òñŠağ4¢¢_¶ãÒàèB‚QÇqZx‘É&q!(ü@H(JQÅ¤E&ù7iDJ:"§û{ra†MT<ÇŠBÜ kBy¢`XØ½>¨'+6¥™(¶’³uÍ¬cî=™ÛÛ¤îp¡Ôu¿†Oè³à¾n^ÿ Òëør7;u¹bF±µyäptÅ‹™T§‘õ3¶â~nÜñcüö¾6BªùSÇ+{wÕ]ºW#c|Ä¹ƒIJQ,ˆ,Vå•ŒWo·ïÛ.éps-İ$„%ìU2Ø¶#F¨çæ 0ƒ~š2"b"Aé*˜JíĞ_ƒ"`alp$(òäN&b@:sCux Àä€‘ÃŠ	<7(j ÒA/–xæ|°AbEx Œ­Sâ8VbMø®CÇÁ ŒÔWŠùb?¥âõ.¦è±8šÏEL¼¿êuí‹ãàmğÎE#v£§œ‰—^=%ë{1{×†ä`\µs«)å)×«^<|×F-î£p Ï¥ˆVF2v‹BïÌn8SO[z)fØ¹	¼	 UüŸ†AŞT#ÅxfNÅÀÕˆ‘3ù"×U·o8÷m[œ3ªZ£šÔË9ÅzÁß»Ï(æY8Ro‡ù€æ‚áÉÁ®óÚ½\?bÎ•ì›.ùƒ¿aÛÊÅ˜”d(xùñù8¶Òâ¾®œ’ú´'h‘üÜ
á^‰Yy0”jt¸×§Z«„’áä±],Vß”jÕ4X­ÉúÚD€ÇˆQ*¦IÈ|D½°g
¸ı"²"DVº„MîWuÕÆ2aAÍnlåà`çRü+Éi®É‹ÆÙ@(|–£6eÚv–DïÆ6\>L»ëíšùßsLLºbCÕÁ¢½¯–^¨„À¹@ƒÿ Vˆ€œLg¨¡Q•Ûû6hşö,DåüĞø¹0e‘{²ãkãÛsnØŸÊ¡üÃ/P¾GzíƒûSu¡Â“$y(`Ğï,œi|½Ûn¹qœ-é*{Ö™Åhb÷¯odHZ9¶¸“"&ü´÷¦å›Ö2m‹˜ó…ëDRv¤&=Êå&-¡ähŠ]-úO“UeÔ5gö"t¨!Ï'é.8rü‘»ü °2ı<è¨hFq`eÔ8½Pyôl7# ê‹>Tò@âÃ‡2_µŒ‹ÔHr¢Í©À=&9\!òâGQ‰‡1¨„1mÏâk"fØ #ÇP #ÄN>
¡|°yÄòS*qk‘uÅ¨†åÄ¹¨“è2	ú¿áæó¶-«t‡ËÜ0¬ä‰PõÂ$·›)c^NW7é/oİ”®m3¿µdk	Y™”ÿ ”©Õ|³İZ=»ßÛ'Å·æÃrÇı²zf[şşjÍ¯©dßzî{lÅàÛ®ãL>`‰ˆó­=ëyŒáĞ`wfÇœD#—w½ı²|Š²è-N3\”O¡U£8’Ä×€E2#ZÇÅÀ`ÌQ-°§ºˆ$åèÍâˆœOƒr(€	pê(&MY¿$×QZp@£.c^hº˜šx"%Ğy?’*´8„€GÅçlĞkã¢s}ÅÜØû%ƒ×KÒC¤êVõÖÖkÂ{£~ËÌ¹s2ãÊä­½z9ms\°Ü£“ó‡Iù|	bÏ±Dä€:¶IÆV¬äÃ2&LÁØ¥x*‘—ºuÆ?'ù[ø*ÜgbãBõ©Ü™=o ¥G5š[†Y„¡x‰ÄdıŠ¶5ln}Vˆ–†CGÁHÄu~ã;Ñn~™?ÍàüÚaÕmÇ›Û·a‘‡3,N¨›¶µõéi9&+¿7…üë°wùo#äd$‡¨<Šø\ÜWKŠû<{å{ uÄ†ªò×®\3§a¤H <GÆ»ùe™¤U´ä¹Øé­V³ræ’¥I•Û
Ù3cÔ	n*ÔŠ]BrŒ¢úş•‹rÜ˜[·#tôĞ®‘–Ş€bá‰âºÊåŒ†.uİñcNmk¿f,‹ W¦’<h·ëN¹x>õşˆìeî|bûDzEÚ*è9h#^!Àå­pxûQå
*BUı@ª…8[»›¶ã0uCØTÀÉËínßÍ0ãjeií—ô¢²áXMñá#wiÎ»‹pT
Ä?²>år—¨êÎâÎHÜñ¢)ôŞ“6’½*aü÷qÛ¦!¾l—aÀİÇ&?üf?|FÆ}öÎ`›ûyteÀÛ¯'¨SÆ™Ã ³‘c&å‰BôıVf&ÿ I+&NÂNxò4EDÛ?ËÇ‡ Œ£Ñ0WÍäÈ4«ËP‰’ê¹‹ø„\§lÆTv>ÂŠ0·!üÎ<Q(ôğ#Ähu¹†RÑ±«~±ğ•?‘vÓ7§ù ‘„`ƒÎ5TÊQâ$õuÔ™pL&FèŒcH|'ˆS
QœM4ğE9Œb9#FpBº(ßòÑEN1˜ÒN9H$ãù¢Ü•Dgò.ÀÚ˜Œã-ap=\)â¹agv7oçÖX£çõãü#ÿ ix”ë¥a]ì=ûjœ¯væäíQbä¥dÿ ú U›3âÎèîİ€ˆï»5Ë¶bÀäÛ7‹…¹eLV¶Ùõ·ó:a+Çä‹]Q¨u0:¼=Ï2"æ=è]:(ev7¬ø‚y…#;djü|<"@ˆ#Ÿ$B'R–ª† †5ğtæ5¢	Rœˆ'Va¯-B%8wc2<e"Â„{Ğ<º yPx€Šã»«»p¶¨{3Ê˜=1>eo]-ëY·¦^#¾ï§#"w²§ó/HÒ#@<¢Og+mbe_µ—`Ÿå!¨¬èÇjÂ¿1")	0c~)Õ¬ÒVoÃ«Rìç’3œ.bÛé´z@ê‡®\¼K—e!$MIÑUc\Ç4Ú ô½@S:¤q¡z×TXÌê¤yrL$è¬1B˜’°C+x×…²c-]™¨Gü<±§ó2ïcËå¸µ¤H£ÇDõ]ì®îÉíËûÒ‘Û§1À~CÁsæãœšãÕëáåñ¸}'·î63ñmäÚ˜1”A1¡Ñ~w}|n+íér5ÑÔŞüYU®áÄÀÏ_ğkäagHÂ¡ñ=W:ï¯[ÕDuMÄäñ n‡ !*Æ±÷ù&
<e)TDÅèz–äg0´$åÂâºHÅ¸|©\én™^ ·’ë¬zkmÿ ²Û¿q/ú¹g¨óˆõÕ}qíòùífßQƒø.ï9:1t*RTüÑÎÎ8}´ZˆnC n‰pø¿5Ctñv/Ä:V«=¨\F¯x@à™hA>ÄäRD* q74ñ¢¹;W!Ózp4"QÂèe‹Ú=µ¸<¯aBİÃCrÉ6¥ÿ Æå©µ†X¾šÙ±sæì»Üi¹"3ùí˜Ÿr×Ÿ¼ı·Ô­ =‹¶÷K§Ë¹(d.®‰…¦¦‡Ô|œ	|½ÿ b¿!CsÇÿ  ?¤“ãö«%l`÷÷hçÑ¸Çf96'‘x¿ª—J–XÇ•¹ù$®aÄXZ5?Pô•8ÂÉ“°qÏZøé`vN$hÀş^H¹/ìIú£AÌ2*bÌu„ˆãª	süQâşfn,¦æÅ©²*}ş|ÕË8<qâ$eúÕL®è›¹mÿ ¤şI‘´?[Ûs¬‡Ãí	‘1ˆ¸d#Ò1-ËTÀbg:é÷²¦L!ÕInEOåµĞ ]wÙDÀ_2ì)6­
	Œ‹b$Æ_ª$<[É0e—›Û¹»‚r°lÎGşí¡ò§ÿ Æ‰ÖöGÓ;v$nl[­ì)»ÂİĞe.¨×Ú¼Œ ßQv&­GqÄÏ»AÏ¦ªæ&ÆïÛ_'qÂ»t~¯”k	1L&].İÜ;ny6İÉmLü»ƒÿ L˜©…Ëf7çüğwâËTbAäU KM[QD&/‡Î ¦R—îl@7P¨™DçXGµœeÙ•D˜¡—3İ]Ç•…+[}¿‘*@‰eÓM%½N¯ÏÇİ²²/dåu›ó:òğ^«c×5ÏdbFS1¿"$’ÕÑ›l+Xğ”z!. )ÒhŞ‹,å‘¼m²=£Vãæ¬ì²¨áÜ¹Eú	©üÕ°±»j 1pŒ‰zÜz¡‹TëêSvk		\Â4PóU¨‘"‹YëêQù“”¡(u	R-BÁHĞ·±… fÕ  áà³ÜÚw®şÔÙè¡€<KòWØÀ¿báµú‹°#ğüÕüZËÖ>÷|ïN{d«`uX&^‹æıÎgœ}o«ËqëÌ:"äÈjËãÈúVåS;2_.P¶:hÀ«ziîã²w–dEÚÖ‡Åp»aîšJhæÛ¼ójK–n˜Y"!¤Â”xñ[‘ˆ¹n1 9c/åz.’9Ú4DYºKpâ·"[”¶½¾{†åkäOå€©4ä^=|¶c—“ÇL½R×E¸ÆÔ?D"!¡`EôäÃóöäP[‰U·>Tª"'§‘Ä8ª¡¾TbO@1—’Ïèhˆ—÷ı`ùÄ*Î”ñ: z=xzƒÇÚtA”uo
 n‡gøQ¹p(L¢9j‚OH±§ÃCèè'Ò8’$¨µö;ù Œ¤C‚ÇˆüPÁÍÉ8âôoÍ¹Ñz&aÛĞÆ`N-ä\ ÂÜ;C¶·¯·Û„¤ÏìÈ¿>šPµ6±e¬¾‚çˆğY`¾\5!±JÑ!¨FQQı¼áñÀÈRâG‘L˜DdÛˆ¹vi?ÃRŞåS# :ä ‡ÿ dk'DÈ‘v2´çù(¹ ;¸ñEÊQ.ÆQ5¯‚*B1àÔå‚\1â[š	tÉø¨§	bôA—nZÀDñé¡÷*…òÈ¤eÔyLWÚ#ğş¨)Vü•ÕXSƒk_"úŒMC6¼. C€=C¨ˆ!ÌKU÷"›¢ÔŞt(qåÆ¼ˆ×Üª	j2‡è™‰ş“_qP\¹EÇ¨,€YX˜Yñù{†5¬ˆŸşÛ`Ëÿ p¯½0®{7éşÁ–óÄ¹ö¯	¶ÿ ö\qWÊ?ñ~ğÚbNÉºÛÊµü©LÚ4àcw®'Ğ…|§©ˆqİ}É´tÃ¸öK¢×ˆÀÄyõC®rt,ÂŸS¶{6Ìàgj|!8±ô µ4Ër™ßS·,«†Şİc-¼Wi¦³ºykëDÅÜûŸpˆœ²şXŠ+'¢yEşş!ÍéKŸŠ™Õœ»nØã§%Û˜Rë/e_±™nõn»ñz¬ØÅââ_€ø“¨ç·Ş×Å¹	\yµZïL×Ÿ\ÛÎù I1'À²ì˜RË·Ä€1ûõQš 1m;Ëá–¼½UQå…&ë¢ $©.Dµ|ÀôŸê:z¦
¹p·‘#¦ºÌşˆcHÆØ~ ÌjOä®2w[³dİPˆê!ƒñ#€Q”.uİğoÀ#YFÙ¸%ÒÂF÷!U¯X…ùNQˆ‘ €~Ü«n#kÍËÙ·ì}ÇlÜ@q†„y%“mqîïÅ¿©¶¬ó¸àY¾%_C¯ÌòkãµĞq^‹³²ğ2ÔB¹áÚlä·{äX3¸\6f›1±¤m\454X»unaİq*†pë®¯.İ8äJ$É€öÕvŒl$¥ÀÊƒ¤M  T’NŒ´çn»7ê7hÙËÊ…û÷m]Ï•k4Ú”±§ñŒâì	âEW¿‡K#ÅöuÛ|c³Ôpw}³s€n>Tş‘&¼Ué|Ë­×Ù©ÒcÈdˆÔ‰6œ
¢@È0€(ßš¸DI¬65ÿ ¤ƒBÔ*ìDC
³Ká/àj
¡ÄdñÑ½HÔ~‘!üİ@œj$zub§¢ƒÔ÷ o•é@İ5¡ğA:8jú
	0nOªt’xªšPƒí½‘¤âCé.åYYËr —’€½1&£âÒš¢äı-Äúê¦'•¨ËõÄù…L<A1Ó|bbj%õW,ø¡cf#¢"Q4Iàõ¯$Ê`æ7í™Jİ"kÓ Ş(Pê$/ÀÒP•³á_r7ÜXÎÜ‹Fq2ş—iCU¥B[][Oz˜S‹“"¼y"dâQ#_B†K WQÿ ¨
‰Wá“·: @\fgğˆá!®B!Ğ.˜Û¡Ñ‡äP<­9¨ÚŠl·ø×Ş#0zŒv‡ôš 2º„ˆşY*	Êb8‘¢sÀùUKPÒˆéÕÑ3÷<-ºÜ§~çËjÙµâßP>»m;<.âmÙ±C1cğ6]g­\WÎû·ÕŒ\œ¹äÜºo]™rÔ‹•k=ÖvÏ¬6¬LY‰j|EÓ¢|Qé¯õ£ğŒ2"!V¦ŠøÊÏƒÖöğÛw8DÂq—Pæ¥ÒÄt–íØÊ‡T@“©ØgæàünFŸŠÜ¹ZÀ;×ìïtL´_CE¯°é,eYÎ°¸!ÂçŒ,®K¹¶{r…Ë‘øf&mj[ï:ÈÉ–$¾Ußˆ>¤}ëxÉ…k³áğK¤‚ãó%FqÕ8gxtMüSV¶ÛŒÈÄÈËšÍb¨åØ#¦¢¦«]ZË"O×Ñ0àŸ„Š«ƒl& HWùY›Ø£#d[•¹	H	GBÔ5ä‘¼E‹W±ºàÈ1ôà¢vdÇøµpj9Ğ?ŠµmŒ[öÛMÕt¢eÇÏòSÕ¯ÅíßG³r³¶1o,¼¬NV¼â4_#îé&ù}Ï­¶uF?ôä:©Ày¯Ÿ‡³.G|¸"H:Ë†Ñêãs 9 i©!p±éÊæ5ùÛéy.Ú¸ì×ÇÈ¶@c§ó½w^{qÜ[{n'qBöçcæíA…ì{v…áÏª-ğòUôxx¼zú¾o7?³BÏÒÎÜ„ ÚoämÒ tÂDdÛ÷±Õzs=cËòßP/ı5Ş±änbÜÇÌ ¸™öÉ¾õ©ãù/Ë*§î»ß·$a;ùXĞş\MË,?â şK^9ö«Òúe­…õ7wÇéé¶[É¶ÁîãOåÌb2x©uŸ“•Ó_wK·ıDí|æë÷0.ŸåË¶`ÂqpSÂúufñßÍÔcäØÌ·ó°ïC&ÑÒVä.ş%cóbô„€fôÑT1gŞ‚--c&òÅ…ÉD|AÇÈ\	ÑÛVA Æ ®-PuUÌiÃı!2ÎÅ©B?QwœP'$U~§›2—¨äÈ yóA¾¯æ3ì?\0r#çÙùdŠÎ_Èşk¾•ºô-«¾;kvk&f’ ±q,Uò÷gÎ–Íü{±ëÆ¾èÿ ş
ËüâZì=cPËH<gn@1ÈÑEL=ˆdºNÁL-)Bµâ9"m‚àJú¨¨JÏSu6ĞL;y?àÑ§T@Ñ‹ÇØ\ª
%0&2û6@¾VåºkÔChC	ü˜Úœáÿ ,¸yL$ctG^£ı@o.(Îƒ¤´ôé•=èu.«ÇIo†ôCª]\4Sü0.Ò‹EP81‘øgêÅ½)s!¸hèˆtNœ¯Ş‚QŒ…$3üPO¢ hc÷"‘„†„âƒîÎæÁí¶öv}ÁjÕ¨™Jo£x&²ÚbÛˆøsê·×ıß¹2ï`l—§cmÄÌ”‡5èé§æİÖkù¼;+pÉËœ®_»+’–¦EÊáwµ-Ê¿Î'CíÑ`ŞL…\e»~õ‘0c3Bú²ÜÙ«Ù_P.âÎÜn\,påv×g-´}KÙ=Û¸X´cqú€¡5M£Œ¸z£Ë%€>>+ŸfòóõÙ²-Ú–U€z¢îÜW§hÌböWwÈßÿ mË?I4 àµÉ§¬km}]ş|c•×$â«Ï+yqaÚ„ÌÈ9 ò]åG7e„ÚÙıU>™V¢ÕÜ+™ºucÔ)+¸[nM‚Áú>jÖ¥ÕOFDUŞ×¾!Â…µKÔ£\Á•†œ	~m|””Ê'8°F•ù$‹môÊÁ„£ÓéÍBweæØÉµ ~zÑ3¥`î»	Fí¢Ó,ïU#RG©}"¾lbeFg[G*¾oİï[êvzEüø[¶e)áÉ|·ÒÆkİ³!~éåÄŸÊ½ZLF]Ëöâ5ø«nU\®àÀÀ1±‘t~æt†4kv\¨4ó+·Ûöqß’FŞÅ¶ï[•ÈååY>coüDrœ\!Eõxø5×ó|_±IÀÍ¨Âå© Ìt§’í‡ŠõkãşÚLağËşŞäêËJ b^b´ñDXº"`A”±$Ÿ0hQ™}»°n_¹À·	Ëõ\²>L¿ø0÷-Í¶­ùW?ôçğ‘Û³çmôµ“ÜˆnR‹ò±|ıã™¿ØÍ´äË3Ü?ÿ ú­(—ëé3sÄUnmøş®“yŒ1»¿¼¶™ü¬¹şò§ÊÍ·Ósÿ p*İg·èÍÖ{:ªMn»}ìBhnZk°ö’ÏÇíXñuË°îû\ëSœ¿íÌôN¼L±uÚ3ŠÕè§ÃÅg(„ 8‡óTFP‘ ôËÆ¡[ÊŸêwÚˆ3r(¦2Í§±z$Ü9„&Uf•<7Í Tú qv Ô‡?n(È8â9¡—ä¾ÿ ¸aìŞ'ÁÌÕeÑÖíPï[ép4aÔ0¥ÅN©Gíïªù¸ır¹Ök%:zNØş¸îºmîXĞÉÿ m™1ÓŒOæµ5öK‡±ıYíMß¦3Èı¶A¡·||²%Éô*õgçtÄÊ€¹z3¶jH>¡<“±¹5ËòU&±5C$bMHx&(˜>š©ƒ&ùmSú¹‚ŠL…Hwâ‚¨œLAjºŠ %Ü‡æGğEJ1¡Ç"®Q"üÀ n˜½y)C|AqÈ¢ â2`â\x…QHÒ!Î‡ô”0q	·:‚"dÎ$PÍõ@Sô“« œHj «¸eÚÂÅ¹‘t|1º%¯‚¿È«ÙÇº^íí²ü†ßbF9JC‚ôÿ üçâí'„ü_=Êuñ+Íkt“öª‚bÔÍH@Æ BR‰äPhàn1æ&%AíZ•+Ü¾›÷Äñ¯Úqªôë·£Ï¶¸}cÚ»ı½ÂÌ&'ú¢j³´aÑn6³ñç	ê¤¸«cÄû‡µ2¶ÏıÃ,úˆkİ¦ÓhÜ¹ãgÎ–F$GÆ\‰æ¼›kŠãf+šßqíNô£?ú2zq[•»ÑÉŒKxù16¦>X"‡U¹r“«·Úğñn@0yö®]S‚ÖÑjäDh¥¦¹}ºl“r!Æ¦'@·6ZÌ»lH«§%YÆ
XÖîAºEÛW*vRÅ¹Ò‡o¥,«b0x»ğ#ÃñY”Œ\ë—nØ6İ‰‹›pOU×»ŸÎÇ½nĞ›¡Ã‹(Üu—ÜÛ&×w+6ìlõH±œ„O%ó~ï|>·ÓÇ`w¬]¿Ô.îŒ´Œº¹|¹Çµí[ËHå®}\·¸Ïäì˜7÷ÇAôEÿ æ’ë¯Ö·½Ã7ŸYÙ«µb÷÷sÈ“«ZÛ¶Ì>s<W¯O¯¬ü^mşÅz¿iı>ÛvÀ.\±+×åÿ S&áù—$|dW«ÇŸ¿5¯GÂÛqìD‘§Ü«…­Âì8úÑŠ2 ·GX èµóÕ«QœC@ñ=CóUa;‘‘ ñ
Æôœ	ôŸqA>¸ĞôSš		@Ö2!½nèÈ…¼ˆ"$=î‰pÅËí-‡,ÿ Ø2ÿ ê“GØ\-yUò¬Ï¦Ø÷âdÔFc¤PájnJ 6.ôØŞ[~MãlpŒşlÂ×”½×#Zï¾ãÛ¤!»`ÛÈY@W)áP¦#gê6Á•ğeüÌ+´qz/ÿ š.±á}:\]ËoÏ€U»Ñ5ø&%îÕbæwE† kBE
dHHhKŸ"'€óÿ DDHc¥L\„ú"PŒ£ Ò‹Ö¾j¡¶ pPËò2²!ß§•
ËĞ4p®R|¸Fzoü”$DµøOL›Ì*5°÷]ß	ºoÇúnráUpÓ¤ÁïiÁ£bQj|È“ ‡ÅŒİev{~äY»¶n“³‘èY`<Ó>ñ›­PÙ~µw4`3íC2ßDôÌîtÄ½“é7Ö.İÏıİÃ‰9°k¿¥ÏüA1YÃ¼Àßvìè‹˜y6¯Ä„Û˜÷3îa¥ÖæÀ‘*Sš¨$@:IßŠ˜\‘ˆÕ›ÉEl(â©ƒFR·^—$êÏT;%óæjaíª¸2œ'hX (ÄÊcJ{8²˜)rUœa1RTT£Ô‡ğ@n™,ú2)Œd>Î6ã®‡Á2<üúƒsµ{rî.ÓûÌ€mB1Ö¡‹¿™êßW>‘ğe­§xŞ2MÁjs»zFSœ©%6ÖÛšÕÍ¹®ÛfúM¹eÀ]¿jdS…ñÃ–ÛÈèÿ –ÙÅ‡ÇlŠUÂ]\şFçÙv¬?Ëˆo›o—¸l×1¥'·…lt–1.Ù0-£jT(“è ÜÙ7[¸9¹	°×MvÃ6eôïÒ®úŒº-_¸À0âW§¼y·×_Jì»¬«1.­çm8ùğø¢	ÕY¶—o·£Œ	´AàÔªİÛ)z°wÎ×½Ó³&—‹ZìK‡/Ê¿ûƒ+üôŠ¯9†³FÊq£ Ásòg-˜`p¢‰R7md‰E )Øs»¦É&à¨æºkrvsœ.6‘Ù)NÑ"G××Š‹Ì³	Yê‰vı%eYs±–I—˜m9%iÌnqï4¤Ñ’7èäû»µ3»†XøV%12%¼è¼›íÕô>¶¸–Ö—l}Çˆ…Ëö#2Î\9÷®^¯éÕí·ôïmÛ#x‰ıQûŠ²WÉÑèÛnÍˆ[•£‚ºGš¶íbÙˆ1:8¢¹eb6\üM)x†>ÔAa ‘ËŠ Ñi3² Ğ j€ñ‹
Tp!$Ãù˜ó%/„h)Ä(¤Z S˜Ça¥*®SéÔÍªlà‚uÌ1¹5õœl˜äY…ÁÄN ¤èŒ\¾ÍíüÇ"ÏÈ™ĞÛ4"·7«—9•ôÚí™JæÕ™òäjÀ˜}¾Os*R?P6 ñ¹;ö¡ÂcæE‡½kújôYÄú——`‹{ÖÙ(‘¬ìŸÿ L”¼^Õ,t[}vŞy†X±tëjÿ öåÿ É–.›C¿k&Åø‰Ù¹Äé(‘!îXdBÕæ†Q“3y¢å$³¢eù¼ö¾Nå!9.»jé,±Ï’-Ì‰Å°®6`X°mÈ€úğ(Æz¶q1æZ…­HöÙ»ı¿XSø.’f>áÚùÒÕËÄû’ÇY³6Ş÷Ü$úMÙ›c…Ïˆ.W\4èvß¨¶$ÑÜlt3´[ÜVzÆ<cµØûÆÈº/í{Ÿíî’$"I‰w¦‹SsWØ~¯w#G>óì°ø£ &§JÎ‹²}_íüÙBÎTå‡OHCG«şmÅ.®óÛó¢%fôg¡· AYF•»Ö.V2wÔ*D1‰*¢2mYÊJ »<|4~|*ı@iÍ0¹ı‘b¢Œ&8H¶ãB™KQÄ¢àı^-ÃÁ İÉ·l|D8âË?¸pñ£#+¡À:+^5›_<ıDÀÇï=Ş7/±Æ²OH‘â½:Û®¸KÍdÄPÙ»KbÀ”­À˜ù2ÅËÛjìmYÛãg¢Ìc£S	Û¦Ïk&¡Ÿ€]2ÔÙç»Ïnß·)|ZJ5,yÖù´˜‰uE¹Érºá½z<ósÀùr4§tX±Ù…vÙ‰Ñ`5¹ƒ¹íúîèDI«Â‹Ñ®Ìm®_Qı<ïy^µfÍÉğrëŒ¼ÖH÷³vµ~ÜeÕÃEÊÅËNYVŒüÖW*v˜NKXF6Ne¨h?5¬
‡?ªŞ)„¦YcS«*•RÆT¬ä£Bj«Q½~İ¼¬wIÍs—~~Pm9.ÙF=Ü~™LÃ’¹=M¹\ùXeÀ­guÜõœŒˆZ3¸ZÛ7=R´Úîï9íZ‹‚DŒ…(±vÃ¯¹¯GÙ{RİˆÀ˜U´5^KÕìòÄv»~Õ@–Ã˜UÎÖİœHA©ª¬åj ?MA…¹ UŒ#MTTÀÔjª'ÒƒÕPx *}€qà=ˆ&_¦¡Á« C¥Ïù w#“sL°ÔmB`9vcV@… jx Q¸y8A/˜
&Õ^Ä0DDñ>¨$%>’(Gj‚fÙµç2ña>­dÕ÷+-‹ÕÍn?MöLÇ8ò•©ği
ù®“’Ã.o#°{£i&æÉ™8ôéò®ş‚ánrk{·ä;¯¿v#Ñ¹âŒ›QÖS„©ã
üzmØÄ­\«›LÚŞé{
æ„˜õÃÚ¼6vféøºÍ¿»6Ğ‡jãŠG¨	zƒUÆëgxÍ–>ZîîÖ„íÌÆÙvveè˜q›>îİ–îæcmƒ©uÚŞıÊş5Öœt$¼õ¬G_Û[İ›×!€Š²ÜŒ]^ÓÛ›uŒëP”X¾â·‡è2ûBİëDt	 ÊÊM±ÙæıÏØÒ„g(@0ú&w÷y6ë´_Á¸A¶z^§EÆêë‰YĞœ­ÖÔÌ%ÌQs;ro{|Œ‰?•éìL#¨ÁúŸ—o¦ÖØ#TJív©øBCöùwpnÑ€-òW4Æ^©±}\İ,ÆşM¼ëcBıö…32˜z&Ñõ{kÈé†a–=ßøÿ O´+ÕŸm·÷Vİ¸ lŞ„Æ¯§’a¯o*ÍÆb>-¢Uˆô‘Jø¡L`úT!„0z2&Mû¸Ûÿ ©-9©…Ê77Lh‡ê‚a2ÉÎî|+—UÀƒ«5g.'xïyã‹0ãv×_vnî3.şFt¾eËÄƒÀk§–ùòÚÙu‘àôd›§’¶ïz&}V¦äØ#³îØçà¹ÔÒªùJÖeÕÜûMĞ%µ*xÊ9NïÉ¼ä*ubÄ±Éoİ·g.”bñgLXîò^åíIÙë"4ÑÖoc¹àÏr0ò\¬udc%•_Û¯]‰QÍØ»ÕËR¶õ^k‡$Ëßöåº-B®[‚¸r˜u0îW¶Ò,9©âgK¸ÏOUyf¡K8^Äy(™¨[Ÿ\‰Ò\B-w~\	—*£6ö`•èˆš‚*¬èÔu›EÉ\°8…•GvÅ˜‘1‰>KRô0Á¹AêÒª£v›[øÿ KĞ{”„Yxø[Íècáÿ Óêc?åÍVmÇwm4ÍtØİ—İû5Èåm#2Î²²~¹\.úŞıÎ=tÇZép{“'­ï{]üI
‚&p¡OjİâÏk—_¶o{flGíòa#ÉØ©eÜ.¶7#8¨<uYË"ÀÄùª	Æµ(ƒÄ8çâ¨˜„Oäª$-°qíA.·$b?½¿†¨° ~(„ÄêÅ‘N8:1Ó_õ@µüÑ
ˆ¦fÅ¦ jÚPêŒä?DÉÄÁıAş’@ä‚7#±1¹Ü†„H;¢0·ÑíİÈKçáÆ#õÇá]&ûF¦Ö8ıËéé»v\­L=õ®¼Øï›9İÃÎU©8‡Š¼s¿;bÕÈÜ”"¹?Án_u×l\>sîŠv²f#À¬m«Õ­è/om·cz,DÚ½ÿ ²#rÈ¶	hÑÇÑç¾ï`Á·jıâº¹¦YÛÎÇc"Ü¢mÕ•”ï>Ñ„¾d­ÀZ
¥êõiÉ^/»í°/“ĞYôä¸İ]ÙÑÎ'Íc0Ÿ!(·‰`R‡–L¢Æ6å¹`K«"p€<Qpê6ï¨Û¾(½!~êS	‡o²}PÆ„¡ræş„ˆ¯–Šb®n©°ı]Ü¬Â/“o>ĞŸáŸ¹L¥Ö='fú³ƒ•Ç$Oå2ø¢ËRå›¥w=å¶eB$İ‰B
¹fêçİûf%™\ıÄD@räp[’Ö.^=İ¿]6¼ÎÖ5ÁzàzÄÑwœ^äÖ¼—vúı¼Ş”†,¾TMh\«báÊßú¯Üy—éÌYTñÊî{w6KÂ^
ÍSâ‡¹;Ç]³âÁ_—Šz7±;«t·ñ]²HĞÑ_—ŠaÒm½ãŒ/Z1<|oãu8{–hÔ,xáŸƒl±z4 ½h¦U•¸l aE¹²Ëîæó6ûö"]ÈÔ®”Äq»î«ğ”.DUßÍL1œ<sº¶8ÆS”C¡\vN»<Ï2Á³9<—0élÏ¦@ø¨®÷µ7#fä ,Åh»ë\ösíİÛªÔı^¬¯+­†g\Yê+ETæw@‰4Z‹+C*á1ñÔø©Q¿‡>¦&¯ªÍÍœcn•'^)ÂŒáó„Œª´¹v[\~X\Z¼–,XÔÜ­õÙ2€«z,ëUÌÊ˜—
Un¦1\WsåS™Ç§€IÒuv‘„%¹Y¡ËŠ¹\7îí—¡b–ØT,Vš°äz/[Èè\=0ªWûg`Ì&RÆnç‡Â_Ì2ÔÚÆ¦ûOUoügrÅ&[Vå.‘¥«ÿ Üš¾SÖ/”½áÆ_r`ÌÂáıvö•q­íSŞÕcºp¥/—‘Õ{ú/DÄûÕ¼v%ÖÆíŒË¢%nq”MhVÖ£pK$Q#.ê¬DĞ ›ºèGæÈ?âÈ›ÍĞh8àÉ Œ€çO‚´(g
MÁH§4L Iôâˆg.Šw"……*µòEBâ‰cçÓºpxh½/.\çpdÛÉ´E‡ö$…ß6kWîÊ} —×ÍZí*¾Ó°wAéöRìôŞßÅğ >Š®Nã4Z­<TÁÙª3mß€‰?WÅg‡+Ün>]¹UÑj&pò÷´æfH=pş’½:rW5Ò"á2±Ò(³âéy:.\ì;y‰·lIÃºÊNW#¼öVNÎÜ%ÿ ¥K£¶er·-äØ™…È³SEÎëƒ-›ŒH<Š ñÆÉ` gÑ"4¶ü}ÎÔ¿³vPàÑ\C8wİ¹ıÓ(ğ­V¼#?$Ÿ›Òñrs£`HÜ•ºU‹+$pÛ—5‡¼GqÜ­œ‹†€uÚYr9K½‹{.ZÊO©%•»e«Í°~”Jä&¼TOšWaµı'³nQê€§0™ŒŞK{;m³°°±¢:­Æ•ÑgÉ‹k~×l`@7Ë°2™©r/ş1·OşÔHòVmLÕ<¾Ê°cı¨t“Ä-Më^UŸgc½·İx¿C‚Üó’õu;nD„z$ïÄ‹­9°ú‚²¬¬Ü8^‰¥y-3cŠßv1(™DT;·6\æ¼³¹vÉDN&¹¬m/î<“zM=qÚ=¹fiz®M¶öl‰[¹×‚é«5í]£™)ÂEÍ*»ë^m»½+Ë¤?W¸ÄË"7 ˆjÁ„ƒ~äVÆ#Æ«Q«¬ĞÆì„‰ V+œŒ®‹ızÅÛ…]lË«Úo˜ÕŸZ¬QÙÙº.cüEø¹^í9mã0aH˜°‘Ñ¾õ¾â†Ó±Ãw¹û«Ñ>ºÑ-Á‡¡l»]¼!q£.;\ºGQxµ8¬7*À±0ÒFÉmÅ@ÂÙXÊlÄ¿TÀü\<¸ôdØŒÜT
½b2.ö–$~<×1dKµ¹ò4[ù/«^T‡Üûp{!™ü²ø$ŞbŠË­üéN×sİÇø7<;¸çŒºz¢şa_j¾írÖÅß6ì°›ğ'“èV,³»Yİ¡°–’py)”OGTH\‘A.¨”CNH ÌéÍoj—T DÑ€¯¹:ú!OÖşˆÂ&HhÆ´¢ñà‚%šœPF†…0 QrùıÒD1:ñ^¼<±™ó"Cú#L[ÑÉüZ*Äv Q+zÅØÙ€çùª–%¸ôŠUr½Ò†õ86š…#¼Û¼Èu7¦Ã33&ÄÁë—ğQö³°ã.‰®l5Zše¹2ê¶¬<¸€OéõYºá1bÎãÙV³mË¤ú‚IpºícÌ{Ÿé°¶MËv>Â½+Ó9²óÃ·20æGCôğ4 .wUòË0Ÿzf›éEŒ3Z8YxÀƒ9¶¤Òˆçrêğ;“nÂ€iƒ1¢ÔŒ]-hûÄ!ÁÈiñÑ,÷¦ß2ó¹O
ßÛ»³h‘‹Ü‰æ®ã®Ûiß6ûÁ­±fÑ<L:¬{Ÿ2"Pm(Å¯\½n úrtòŞ.Ú,dªMªŞ&ôf@ækæ‹äé0²-_¡§ T:.]Ûm^«?%U·|‹8sY\¬‹qé`£,ü¸tÿ EU™^‹x*Îwİ;LnBdj´½	Ş;WD®­kä¹mõ¯2È„È÷®Ñgo¸× 'ÕXW¯ö^h,8"”û™wÕÃxö,ó#ÔèºJã¸Âp"„ª­+bBNÃÅEp:z€¯”Ë7uq-j±‘j]e´ûÖª:,sé€âurÅ,/›Xü©Áb´Æÿ m»ºdNW‡ÃÄ¼â5ÙÖm;\0áÄQ—+Hè±m±è°êÕ´GHu’-G£‚4‘4*)úbx0óH‡©t(È€‰` w(!([¹K°T™]¹µe“#hZ¸š	ô!jo´jmb™íıË»~tŒGò]ø‡·U¯9{Åò—¼/÷ó
™˜ß6#YÚ.=…1/j3Ò¬Øî<I›¤Ú™5ŒÃ}éãYÅjYÌ±v/€¿%”XŒßCê†Ráà‚Bà5#ı9#Ì,h9 ‹_
¬9 Œˆ:Uõ@œƒáÅ‘0_1…P°º§4Cü;Ô cÃƒ3‘n|—©ç¹Ñ2•İ>Ã«¶2Å²ä°DÖå!ü©ªgHŠ©Œ³rw9Ø—P–ƒÜ¦WÇzàA?uR¯Á»ó®Ç€ä¬¬Û‡¡öôgb=V²¾YzVÛ8Ü¶#1ZUs±œ»àãŞ·!Ò4¨<R1Ş;8…ÉNİ¨xp[_'“o;UÛ ±#í¢Æ]uäpÛ†Ù›bR”%&«‡&‹6:M²Ç996ËLÈÍs¶´˜ÏºuóSÉ†åt0ë.CK{È¶Aë4ñZ›&‡ÚİÕrmƒ' Ö«¤ÙÊÇ¾öÎñûË0èŸ£­×]e»Ó°e	*BK	^uÜ¶ã¶ÎR5ˆÕÂé‰]$•›¶wí˜\è¾:dìj³b]´w–%Ğo?±‡<aØ`w=‹€0Ô¢xqŸÑêÍÖT#’VÅi¥{×È¿*¤FMæ‹éÅQÏï…Ë2&¤R3—‡÷¾ şá"¥Ü)³®»txnïgåäKƒ•çÛ»Ñ.U1OLÇŞ¤•Ù÷fnÛc£x¯F®[W¾l'ªÄÓÄWG–:¬[b\hRº.ˆDES(=¹ôE†Š
„Ä¡Ò=‹PŒ[¬A`]UvD:£|}V*¶¾L® õ<–r²50°Œ@1?rÎZÃ Ç°DZ¼BÅkğŒa<Ğ-ÇˆQ¥€ñ£(ÖDv/æ¢ŠÀµ?Õ°åÉ1à]2¿UC+WL`˜\W‚`7ÌzH8àáL
Ù89 |ÛQ¯™‹òíëQ&X—ehğ ÓŞµåW&ù;Î&’¢(9¦eN‡ózÑl«2‡üMFW=—¬n¸×›¦`?ò•0V…èJ¢TQ2¹Ëø"ˆ&çDH:ê‰i0à‰”z/D\™BL|QÓJpU.ªtÃÍz2âiåÇŸª™LsYÛQª,ˆÉ¿š¾<•Êá÷>¥YL¤‰Ë¨~¯EWÇ4—’Zz²w¯„uªÎIİƒ-Îv.Õ^I—Y&Ç¼Fr„Ÿ]BG-ãÖ{w:7ÖÅ¸å‹•¶İ1cåÅF–3«d‘ê‰^AŞÙ×qºúƒmY&ÒJò[›î-ë¦ÔØãEÊÆ®‡8XÙ‘xµV™X›ŸiÂè&1õ]İ5İÅî;VLIˆâçuvÌ¬©Fp- A¬aJ3>*]¿q¹r$e¹RÇ·ı?îÃÕjÜçÉwîóo¯«ßvŒëY¶ ÓÂÍqŒ¾æíëY¶¦DA,|u]5Ûî>ßÉÛò%8D†:hµc¶·,ÜÓ/@JD1b?TÛWo³÷è˜=ÒÀóvòZ•Î½;bß¾}˜‰\ø¼İ/vk÷æQ¤¸qQ`öò…È±õB©åÉ¢zR&X™“ê‰Œ®Ç‚Ö¯2ïhJÜÉâ	5u¯Ÿ{’È…ù9Ô.;=z°-%Wğ\ãnÿ ´¯ô]¶_’í«–ïíœ¯™f'‹k¡]k©4yx~(²¬Û¼e ¢®Nq„	¾å–XWs#rá‰×Ø·…FÕ“+½B¡êğS+Ó	tF,ÔÑsÙ¼uuXX®Å¼Šç–›8ø‚-ÕÁL®€€ÃRu(£Z‰,J€ñI(«pTX„\¢eâ<”hı'†ˆï@Ä0?j ¼(ª%AªÁĞ4‡µHA	?ğ@¢ãTŒØëâÉ€×!nàkSİ›õb:	â(®jæ¨İÚsqş,kÄü¦ªù÷»–)kÖÌ¢?™•ÄLE‹;í“ğİxHêş)ãRÊÑµbía TEˆÜPº‚BoÖÿ ‚Cª!ÄO4Påx@äˆ¯ÎS„se×.xæäô¢JÖ –w®)“Ï6íà¦D?xIÕ\­•Õ2ÍX­àxòL˜RËÍp~*k4‘ÎfdÕÅ8)—H&ÓºËğ-kÍjR½w´·ÁÕlR‹¤®;L=Ã·óávÔK½²ènÈ\´Şå}ù€nÙ¸ÁÀ .‘u|ÙÜX×±r¥8ü,uÏRGp]Ä˜ÂñÓÅc,í«Ğö­×p€ŒˆêâüÖœ6×¹½»c6Ùœ@$×‚DòÃ‚ß»*P2¹j,Eh–=ï+…ÌÛoáÌÆq$hşKŠ‘xë©YGln—12añ0ê÷®ÚÖké.ÁßÍÛvã#Z ºŞÏ&ÓZ±Ñ•f¬I×Íe—-Üı³k*ÔÚ"¼FµZ•¬áâ]ÃÛwpnJP‹£-m2í–&.]Ìi—¹¥‘è±¼Ô@Êş¾+lm‡–g I<)â£öòz&8:5è5û¢@{Ïš2ÇËébGú­­êà»¨ÆV&v:¬ÔŸ;®-z^kÏVZßëoW(èí{\ÇæÄkÍuÕËg¾vŒD­Æ'JİåÚ½Ş?Mº;ş	•2ù3©Õ™UXÊÉ{$GÑ–"eÌÿ rY4åÂéèèßÅ·Äş¿¹×4‘İì¸¦äÀw¬lÔ¯À8.n‘£n¥Š(±¶õ>|Ô„‡š‚Ì!Zú„\,ÇO$ZsÔFR)–Õs¯â™©ğğE1QVUğûôS
@ó×‚n~ÕrˆIÆš ‰/MJDŞÄ£‚.õ@ıD
ù†âÄ¼|Q2iÈ|@I0Šwöü,‡x |“¨Î»°N«é‡ª×—»^@¼a–—÷GÅ‚½)Ò‰o|”>ğ”Šx˜öhYİqn€Ò Ÿ³,áœ-Fü$Í'}:‚ÿ &%Sù ü¶9ÇWñe¦°îÉĞÕ¿ráİ7î)ïL¡…ãÎ¼¼)a|³½œİ\¦9dÑAG'$±b22.õ8qôQUíÜ1—’Ší;cv•‹°F”‰+¬ch÷ŞÏß¢a©;Š­¼÷[‘š.ÇÑb÷È³*j(µÃç¾ôÙgr]y©´v×g—äØ•›†šÆºµ6Œû¸×"DŠ²RØ;‚7!w›«˜â<VãÏ¶®¢æ&.ái˜$rÍqÁÙĞº%(D1Ğ€•Şr<¯zíÛø	=¦‹Õè—,¬YÊÍÑÃŸ˜=éşşlİ¶%#À3®ÒôpŞ>íıÈ]³	ÃŸ5^vıÿ —~+ÃÅpİÅ°ÚÉŒŞ4¨Z•<º¼{~íùâ]”­‚ÀÕù%ólÒ•‹°âzµñH=khÈ{™.X5­K— ‡TiÌ¤nR·šñbkâ®Õ|›İP>şH™pİË2-\=üÔ««À»µép/UÇg§G%êõ\]mÆ_:K¶{>ìé(»<Ûwz]©DØvrŞK)Ts#ÒÒ¨µ›{0·O0˜W¬Ú‰œˆtµ«VöI]Ü3 …b¨ZÆ#ZÇ³ìØfÎ<#!V^m®[‘¹jØ§œ´´ ÇRã ì"¬Ã¤šêÊ.b@E©Åµôe"^œÒ¬;ñ-ÑPúiù($ĞûP"æ¨öª„Ä
h‚$–r=ˆáó:”¦¯¯âzëËšòäˆĞù#(°E&!ÄTY¾ôCu7š)AÇŠ ŞÅÇ¾>(ôÑnFÁbu´ze¨bÚ-yUòª2Û÷<RM«†qàú­f.e0İ³±‹_´Xq	ã/cÇÙzÆùfëu>Ê¬İjYWíæY¸Hj2ü¬âMš:%×ÃğD3M
ÖE9ş(âáB‰„ö Œî¾*¢ùŸj‹……Ër¢*T;Y1œzyê·
õ>ÕÜîÙ0Z7¢îóíÏ°î&ì L•
¹WKzı£J]T2óNóØ~d'8ÆšĞ:ßvõ½^¿í2µrG§‰¡¦¼W-£´Û,\{2­ŠæÖ]Fß+–ÄL^ˆz­F+¬Ú·»–%\‘é£…¸ÅÕÛ`äcîªA~
aÇic¸{RÎM™Ê0wª·¦øxÆûÛ·vûò”`zF¡fêõë´«¯“+QÕ×É5GÒİ‘nã[$è?Ò¼uè6î x3¨±["?1Ü»ûĞìâû“i…ër€%••5y½Ü3’Fù-WzìvL³Ój–8Ù—F&nA½*Nrµ&ÍQ·É¶äùù…+5Å÷=ãòfIzZî‹y$ºã³Ó£´>0Ú…Î:;~Ù7"[ÍvÕËg¼v"ÔhÇø®Ñç±ßãÜ¶*ÿ Á(låĞy¿ù ç³/ÆĞ3™¯äaÊfïRGÊ¶I&L®³ªë«Øşœí42.ÖRøŞ¹òmèÛ×1£ÓÇEÁ¥èğ<TQMàU·l‚+íC+1¢‹‘E>¨‰u ‚!Ö-Äq
¨‘ºõÿ E#8Ÿh¹9â¦(õ
¦–´ç¢¡7.(%Æ´û9dèå¢1  g<Ğ;~¡t“§A@ÏÏ@Œ¡ ô(&$;Õ–æÊ„GŠªu æH;Vn  ¡eÄºäªÖjæ¨İÚ2lĞ™ûÕò÷\¿/âúj°¢Ç_Äj€špõD3°p|ÕHQwgÖˆ¢EN¼8(•	î*‘JìÜ–4QUe«:Šx3²£gn Èx­FkĞ»zK®±Ëg©ìy¢ÌC–Ño»w›~u«°¨tÑJÁnX–r­H0.%2ñóíÏ•)NøMEÚµzõwÖôyìfñ‰\W+2İÛ±Dây”Ã£ecQêú+	²ÖÍ½\Â¿ÎTp*´»L½;mÎ±¸c d	"¼V{<ÖaÎ÷?lÚÉ·;‘‹–Ô¬ºéµ0És3«§¦/¯ÃÑœ½‹°¯µ¸Dò[}æ+Ö,\Ø«†YŒPe&$sZ_Fnãoæ[><‰Ú¼ßzÄ0¿Õ@u?réİÓ=Ùi!?šÏ£6áÙX€èõVËˆ}+ÃÑj,däŞ"%½}/WİYÙ˜'GnKoXñöèD™q¯N±—~´X½´ìu]ƒiOßW-»½ï·1Å»}H]gWnB¯4iSuË±jÙ‘#ÛWRTypwLæ#*9ª:Mrâ¯w1¯‹ÆAâ]–.øtÖW©öGÖü<;vñrƒB,—İ¿Šcñ{—o}KØ÷X@ÛÉ‡T¿”È:Rëc»Âİ1rb&$ú1tË-Kr„…=ªäQØ0¢î—óEÀdLIıü0±óQ0A§¨ğCz¨Ô"$*8êĞù $PIÙz¾ÅõOj'3 vx cfŸŠ&QñE'Õ$ÃŞ‚$h‚‘¯z"ªD0bP5ºøèP3ø fh<ø¿ª¡;Qå$C°ş*4$|}ª‰
–@ˆ D;3óC$KWR¹ )ÇïER¹ Tª5üÖU+lã‡ªÒ·v¸¼ããêËQ—£l0?]cÎº¥j Äùù…·6–İÜ"bÜäÀ3¼e0íöİâŞL—¦”\ìc²‡pá[Ì±2@.ŠË‚mÕâûîØqòKb*ú(õkr[A]'š˜cxÜ¿…¶œ iJ{”Ã¸ıÏxó$8n!WyÙ«Û]Á,[‘·)—fuXÚ=;2Öv>µ#E~Ì-Ïf³p™Ô¾tºî¹Ûv¥‡|A¨â‰a·W¦aİ{aÏVïpòo×Úµ\b+^T©\®õŒî@òäµ*Æ&Ï•Z¿¢¶5c®ÇÉDø¬1{ªçdAƒV¤+;'ûdéÅ2¯4îÜÀ-L?5Ê·¬yáw®ì‹ñ+…¯T>¿™r4â¤+ÔûCõ[“q¢ôjákÛv‚-cÄËUºãW37+vaÔeé¢+Ï»—¸Lã1nDy,çÉÕåû¾õÒ'Õ?ˆğñ\öÙ×ìâ²snŞ¸âTóà¸ZôIˆ6.díE|–ZÄt›WteáJ2³vP ¸b¬Ù¨õÙúÏ»í¦¹|Î¥K«*]e{?m}wÀÉ†dº	g%\Ç;Äõ-ŸêÍ¹B&ŞD	—
¹âÇQgtÄÈn›€¾ˆÊä'	V'Å\ªÄ<ßš?Há÷Q“6ˆdŒKP"äÀ”ù€z _::qA8Ü?êyj‚$ÆÓNhqNZ ˜•K­‘0w	ö""G­Ç2cËØ‚2DÅõ A>®‹ ]~¨ÇDI4(¨È‘ùª"ş?*bô‘¡"tz£)¹÷º)À­ªô*¢!9hÈ±Rô…TîH»iä²¡»—PŞµª££Ú MÈµYn3³Ò¶+MË‚êáoFæSÆÑà?§'+;:ŸJ–W-Èè;g¹ş8ÂäßÕ2o«ÒìgC.Á«¸â£”7¹vÈŞ”E÷­eÛJã1ìÊÆCT1÷©‡Jëq-‹–›‰u
8ØÅß0âK?˜Q­k…»nx×ú¢YØ#¶¦Á¾J0…²tàèá¾µÔÂ7`éF:«—?.D#uÁ«»ñ]=ogeƒŸğúh°ælÜïæ îWU|³*
µ,6&ä%ø)/wVïõÇŸŞ·—F•Œ™Çà%üb°^WüèªÇ9ºeôÆ@IX«‡•÷Vâd$¯/rç]u?¹#9¿¹q®ÍMØ•ÑCæ·ªW´v~0é‹•Ú<õèß¸ıµŠ‘@çÅW>î¸{†@˜@Ó5§µÒGœnİÁ"$ÒykªåvtÖeÄffO&á$û×¢LWmVZ'GEjƒT·zq!¤ÍèJÑÅŞ2ìi2ÈÖ]>ÕßYøR¥9®Hôm‡ëFñ‰Ó¨¤Š¾Lİ:½;aúú1ÍœZ–V/zvÇõwaÜ£ÈŒdx8ªçt®Û¸ğ2à%jôKéTc[yv®D¨™E(XÔñT?@5mP1´ĞÈfÈ(¹DÛÓòEÉDHx¢$ç¨™9ä‹”X„2ph†KÜ†Näi¯àŒØ¢Mİ„üP;„.z …=~äZº à‚}GŸ>h#ÕU ºƒÉAùMhh¶šò:*	¡Ô‰ÇBQiFi* N^ŞAVéQUnWÄrR¨^å[$	Ã‚¨é¶I˜AW]#5ê›^ Xá[y–¿°iNVœäyŞşğ”µu—XÁÁÜå|Iô:h™o¯XíâmÆÜ¦í@K:<ûGQ~pÊ¶bX¾¾kI.®á·ˆ]7" sU§iV0gÒñ>Å—=„ÜmÆõ’uôQ#‚İ°¾)I¹‡QèÕ‡9Ø˜¯ª`®›:]1«†Hç[y2êïÇÅo#¥ÄÎˆF¡ÑG;¿˜d«@õW²@mf˜šË×óW+bôsa0>-NŠ&/Ê:·ZªİB2%é ¼”¢eáĞI%ßTÉù™Ñ	“*1X­¼›~Ì7®J«®Ú°añK˜âW7GK°ãÎwcÉuÖ1^ÍÛĞÖ!9`ìWL¼û%¿wmZ6âtÖ©èk«Ë÷­ÿ æ4Eı=¶všåÄååİ¿2IqÍq®Ó ™?n+64,d4*(±”Oš*aù (“k¢(‘˜ühËˆg”X$nÜƒÊˆ«¶7l›4ŒL+cº2,Ê2Ã	ª;=—ê–õ·ô›9²`Í\QkÊ˜—»Ô{{ü€Ë²cïÿ š%nY\ï¯Xíÿ ­{â"',Ï”ˆ
¸Ş:ïöşñÚó#k"ˆL9ÙcfŞëv±˜#À¢-Z¿	Ô<y2¤€uE7Ëiê‚?/ÛÍWš)˜º!º@«2Ãø nšh¨‰yù nŸNÅRÉoÈ*#Õ©'Ñu(|}èçÇD1 cO·µ%Õ!¼ıÈ?ÿÙ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              x­XkoÛ6İçü
¢à¤‹­µË€-İ^êlŒ6pœXWŒD[ì$R%©¸úãwøPDIÎ°	´¾/Ş{î¹W”oKyK¾{qúò«©‹ú g.X~4ùu~½¸š¯Ÿ“·+Â>ss4y#IÎËÑ™âµ!4Ë˜Ö„–¥Ü±|rüêà y~ğ…LŸê±nV—dõöf}ùæ·'¼.¸&^2R2£É½lˆbÓŠÖîLÅ>5LCn$Ñ5Ëø†g$“Â(Y–L‘M#2Ã¥Ğ³ƒ/Hl}_ó@ÜS0ÅBS"›9Å?ˆ\Rg^ğšÜ2³cLÀâfµ$Ú(.¶ˆAEN8NÌ¤RL×RäÇgf%Õ:©˜)d>#ë‚Í¶ğáˆæĞZ!Uå2Ù S¹CBH¦¦Æ0%Î\²ì3­ê’Í2Y%qÌ„ç‰3¸DË
Um¨@“OHß1uâpªè=ÙQa,8ŠYÈÜ!q‘HFKˆ)hÚl6@ş¸<“EåÖRà³ Á·±* åÑ¾*Õ¶zæäFC¶ÏÙH_[a$g†òRû¢cj}–$™Ìß
8 Ö9uÎÉ–	¦h™(Ù@?+LU:<ŠÏST¶Z\/V,^;V/®!yÂèˆZ€¿¦P TbêÛªX ãĞ}x?Á¼Ó¦4iGìÉò™ìX	Ùä•'·eó #rğqÈ®àY1b'Ñ…lÊ'¥¤9åÛ#$f'ÙCÁ*”äÔĞÕlké­¼cØ3˜'Nô,$ñÌ“vıĞm)§ßœ¦ˆ¡hà‹Àÿ¥ÒIM·,­¸Öhé¸ /Kb˜ıƒ4V#5ª-Ìœ¥;èâK’ÚU+y‡Q¦¯ÃtF…ÆBPQ“–ÜCpGKºĞÏÜ(*4ÖKÅÓœê‚iWÁÅ|y½ˆZ€.ØÀ@)3Ø4Ô÷ä„Ü62;ë~‹ÙÓ#qxXI®uH¶ë²Û5~‘A+´ÓMjhZcs˜‘Ét‚;Ã.}Ä.!‚1‹ÜIVP…¤ì~ÀÔsÖ}jğ¬@ÜPV%ª&ï
ì=»j5Ãö°¼’µİ‹¢õêfqb]O«Kš12_.C>ãG±k¢Gxáù¤ÏHu?íªOÀbö™L†8¢¾#<˜Ã9;rA ¯:x´T|lªŞ=LUk9&-Ú*[èF¼°@áYÛÚ¡ÙERÊ-÷îóÒ}î‚9¡b[®Ñ¥ÈnÕŠ¦v-Zf¤ pöwäpÓWÜ@q«Á‘Tyäw>Ğ‘?f/²GVàîdW°bj‰Ûİv?'´	bŠ ŒpÄÃs!¶}ë%CÃœÙçG:¶İSİ,¼²m‚;Ñ¢ÉĞ0ÄÛ‡øA1tÓßôÒ¿v‚¡Yˆ>²Á½|è„EöW»œ« š†ø{<Â	­fèäé¸îpT«:º>—¾®×
Ï•5£Y2<|TÌqŠ{Ä	½Õ¸ŒøZcù¹åzŠ9êˆÕŞ-ÍqEûÎ]L¯Üï»”itê¢<êïI ;Qª=y¯¼|ÿ±!ëhãšBÚ^»?€?‹²ª™áF†õGñ	Ä&ûCêüˆJcKßä«Ëó¸¹¸|'-ëÜÆ
©",#³–jCëVŞåoú”om|û¼oÕıñ2±!G«Ç
½ÑKÏÎêå †úÎtİ|`¾)S#{ÛÌ†¾ˆ¥ı\­:”¼ß×„¢{ƒ0L|lhIÃJ´N×¸iù{Xûô²Òº5Lqà@Ş•<PANï…u~·yÄ·Œ´ÂÅ³zûıÚµ¢şZŠ,<	/¢’%Ş˜{›fcÅ)ÊlšX¾gÓÄê0³İ¦‰•ad²<¶ošXüG›&¶ñsç»Ëı G@ÆÊ@™Ç|a‚¶ˆcxm¼IÜ”Å&>‡Ød?
½tbóQÄ^f±åşÀœQ eûŒòyƒ‹íÅ~’)Ò¸(ßqøP·‡,C“a†}Òà{r^rûF]ª2'é/Ò ïÒ ı2¥O=HC‹ íì;tO“t¿oßÀá‰«ù¾+“k÷²i_È×d~…¯™°}™~ÒC"piÍ“ğ~ëî­:9:Muìqkñ]Ìá‹É+’$$¼ÆÓ‡‰›û`GÍŞÓé?óéŸßLH§¾>>š=ÿïC|i‚—ÅäğÛÃÓşßÿåÀÕ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ÿØÿá Exif  II*            ÿì Ducky     F  ÿáhttp://ns.adobe.com/xap/1.0/ <?xpacket begin="ï»¿" id="W5M0MpCehiHzreSzNTczkc9d"?> <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c067 79.157747, 2015/03/30-23:40:42        "> <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"> <rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmpMM:DocumentID="xmp.did:258ED9BE34E811E5B0FD814EDA39DD7E" xmpMM:InstanceID="xmp.iid:258ED9BD34E811E5B0FD814EDA39DD7E" xmp:CreatorTool="Adobe Photoshop CC 2015 Windows"> <xmpMM:DerivedFrom stRef:instanceID="148CB77FFF3F0281B7E8FB247624CB78" stRef:documentID="148CB77FFF3F0281B7E8FB247624CB78"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end="r"?>ÿî Adobe dÀ   ÿÛ „ 
				




ÿÀ XX ÿÄ ¶           	           	 !1AQa"q‘¡2B±ÁR#Ñábr3ğñ‚$’C¢c%Sƒ“òs£4D&   !1AQaq‘¡"ğ±2ÁÑáBñRr#¢²Â$%ÿÚ   ? û©Ü	±'ç_ 6Èêy‘j÷cÔs?Z¶æ ‹´ÈL n§ëAQ$µásAĞ,Çg(<Öâ~´ÊO@óÄÚˆD«6?7ZFƒóu 5	¹½!æÖÄÚœ	9˜\\Ò)6‡¯S@¤5êi8éÆ„ ±µ¾ºĞ´Û‰úÓ‘@¶· IåQ‹$Ú€M†ºI¡	°ÚÇRM¨”Œ+hAùŞ‰CÔá­ÏR=M¾5P~dšPƒ&ñ¹½!‚İHé@ä.O:B¶·'Z GN@'´&Ín&îêmU(NP Ç™¢P–¢³Ó”õ4àr2Xó©„‚[›]zİn&õ,¤ıM!…ø|h‘@ˆ`t&ÕR„0¬I¥!7à	?:¢d,ÖĞş4¥¹>4HƒSÄü©ŠEv½®mF„ÈİOÂ
R=N—4¤5·¨af·™Ci€¿2oñ¡‚¸Ò‘´ÂÄó×ãD„¤Zæ–ÀµjI¦ØÒG3H['­4„Ü€İ¡'5¨Xõ?Z$pßBhÜ˜õñ¿Æˆ¶ KqÒ»OÖª@<ÖãJv`	êiAjÊsãDZBÌ8“õ¢@Wn¦œìØy¹“H©ù›ÆßELŠÇ©Ó1$PÃS~µŠ*Äm}i‰|Œ®”!Ù-Í27'·Òƒ]Ö€¸ğ ˜ùP~T© Qj	JXöÛJr;$†úÒ‘Õ ¢Fà‰N•I‘tH%…KeVºÓÎ˜à-á@†÷P%¨O-zĞMµé¡û)-FÏÂ‚€‹éÒš`õ –¿Z ‘†BÂ™œé¢Ó[ĞÃã@€šrJM±ÚÂç"˜j.TÅ(eHğ4IP=>tø
Ç…37 oÃ­ÉÃçH©C·ü¨(Ú©2r s¤ÇP± 2u ŸÈXóáHs¨d·!cLR nÒ0¼ùPØ’¾”À-ò nt-ò acô¤9a¶˜ƒoJR"€L-z
”ŠÉ
ÜéÉ-±ØZÔŠO@ š“l6“DŠ$6›Ú™,`i ¥%-´¾ÒhVğª$a~”H%!¶Ş4¤m¾´äC	òéI±ÀmüiHñ´Hàv¤0µµÇ•=…´ÕIXÀ[kRhš ¿:	30¹5š4h-kP‚ßZEªÊN6¢H¦Ş5RZZÚRCÔ–À(‘b §]4§"‚A:qçD/üµ ¼ƒoZd@m¹Ö­õ­¥"ìà6ÜP °tD >4Ù	9ĞetÓuh_9
ÕÁ¾d0¦ú‹
Ûj$¤!ÆüG
dÈˆ¿î MÈ­øĞ!í!­!´súP!Ø\XP7ô"ÖùĞ9”ùĞH­Hv6µ Õ´ $Vñ¦ ÛB`À-$‡aoh’¼´ Akh‘@‚ßKé@Ğíj -á@ã{S‚[CÌéM°H{ô28
r=hÄ6üéHñ¼è‘@¶S‘bÇ·©·¥9Qí°¤(ğ¦Ø$uá¥)ÑD„[(€(¡±D× {€^BÀmß@š}(ºĞ!í:IzÒ
Ã1ÂÚBi‹i½è!ÕÈíAa´   —P·÷P¼1Ui¨öÛ—EÀ­ÿ ::”³âk	6íˆ¥#Ín9nE9@'… ”…©ƒD­@´µ z
µ9†”IOQòHÍî0£o5- µ©î4ñ)ŠĞmÂ'·1HÕ½4täÆ¶¤ D¡¦@öéá@h<¨‘@öÛ…‹Ò‰!z}iÈ±¶#¥èL«bT¤P°h‚%HÓéTKC
N´HÒ‡AãC‰z|ïJClúS‚;EéŠ”İx|éÌ¥¨’±‡:`0¦@¶ÿ mÚã­1‹g*$œG¶‘PyP=¢×   ÖÇåA)Ë¾M&€niã@µğ •2;Z‚À©½…C‘åA-6+[:q$·Æ‰4NCaùÑ"µ[ÃD‰V	m"ÄÑ%@mˆ½éH= .îZô¢FµLğ¢G(¿ã…)ªRê¤‹H€¾¦)dÊé¨·Â¥3AİÎœ)P)H´H`xiI‚bÚ8šr6ƒmÍ‡$KQíüiIP¯/ËP(8p¢KhÍcsq¥c&±¨ÊóåB@<H,h Â˜% ÂÜ[ë@à
éB€-õª% ‚O^TV<)’H/ÓéHà[oı´æŒŒ‹iÒÚí6A´t¢Böî¦˜ {EïJG6ƒÆ’;:p«’q§¥9i­é@˜Æ€¶ o­ -´ íò İ( µõ¶” [€ oJ J–Ôñ¦Ø’%jC ? [GOo…0¶ E "·øÑ! Ô mµ¯D„h ÛGeª¤P pçD’å! I7 „Û$WO¤ĞzñhlU@W•)Ğv#R/ğ¢JØ_äDqÊc	qqÃ¥4¤v±áJDÜ‚~TÜˆ{ša¤mÅd5SÀÒcª¤[‘Z™šp1ã­+|‰€ähB°ÈPÇQØë×•"áŠÄ~TÈr€€~T«j:P!èGî Ñ´Ğˆ Ì`\F•R‡´
$¤’Ûğ¤ThH‰ª3İÓ¸×…)Q8R4nûI&Õ‰»‘Z€L^BÄŠcÔÿ Ê™Z
¨ j;m(¨ "€b u¤ kjbH{lh‘ÀÊÛJ$€° Aj;P ·*;Z€Z$PE<…ˆméB`ĞmÖœŠÔäP=šR’ Vÿ •2FÒ‘âëÂ‰"µ©É0;Q!n_…h‘ÀZús¤;kâh€±øSXÒ(-D€Z€€±µøôµb±¿Ê™œ°å¯­ À<(c«lÒÜ¨|Ú8EBÜ‘,4¢K² ¼yÒaX¯ãAq$J‹‹|é£;C ­ô4	|1°ı”Š³€)I[";I$U&c+×!mµÛÒ‰@$ğµ:Ôvçz“IQz©1h6Ñ#ş´H ˜]/JM*-§ŸÒ”„°·‹[16@ÔiH o©¡1´E¼i¦(q$Q —Èöı”¤½m¿$—¨ÀúÒ) [ézr¶ãÇéJI…åAuA·ûè$£i¹ÎvAíV¶!(|é‰V Ò‚3P-Æ¥]XÈæ)¦6‡´èG
$ 6›Ó‘ßò ”m…9¯­ 0(~\(A´Q!Œ-µ¢D"¼H¢A¡m6¿*r(})’8PÛH¨¾´
kSÚî ¢‰An´	´Km¨BÚ´Hà6ğµ(¿JrC¬…"’Ğ-Ë•ù€ÛÖ‰.o:r,CoÒ‰—4I8K§—D‰è0<)ƒfê$XH±êh’b×¹øS‘$Iñ¢EŒ¦)HİBÍÃ•0ÔA:ü¨‘$7±¤V¬[uµ9&	Òç_
RR¯Èök§*$¨ãõ¢Eo¥°XŞıhF  `E ¾¶ĞP0ÛÓ•PÚi ¶‹ëNDz}i{H ·O
$o`Ûj8.Y Û¥L P´³_
$ÛóÒ‰RÄT
$–‡¶‰)VPm4I0=¤páJJR‡³ùÑ"ƒ+º±:-¸ö__¥9*TaI#´~•rKD¶áS#Äa,¾^4¤`[O: ÚÔ í@ÃmÍøxQ"‚V¶´,-@1ª’ ¤›r¢G*>T&,`V§"@ ó¤6†&€€·^4Àv9ô¤Ú:S…åÆ€€Ùõ§$ºo.B”‚yä2òãBbpƒeõ½K«z†ÓNJrç@¨%½E¶ÿ ÙDåŒ¯)ááL´Ñ!¨Â<¨‘$ädkk}iX8qü)ìÃi7Ò”“m,iš§ ZşIœ¶)H à:Ğ6´¼(‘@Z‰zÜÍ€¡<E8‰jmDV2´¤P-¶å§:rÚ$a¶ü4‡°k¥)¤Ş<©È aG
$¥00 iJE°§"€
n:Ğ
G²æ”„-4…·;Q#€	¥‡R=‚‰¢ôHÂÚÛ—Z [zğ¢@v¸ıÔõ¢Fuá~¿$ Q­)]/Ë¢E
/§TäŒ:q¬‹AZ&†?

¤ĞKRJ°¶<èô  ¿
 aG5 l¶¼©È4iÈ 6›\Ñ!
yp¢A +oja­ş”ÛC·QH!Ô[zQ"í¾£…9<(’Ô ¾”¤¤JÖÓ¯$¡¸¦™@SKsëD“ˆm·]iÉI@m¾´Hdv¶‡çA`T“¥)"ÈD|Í2X½RH(iIx¡r|8Ó’,µĞ[tÛo †œ~40«÷<ùP˜­¸­@‰l½´ëJF—È€¶”Ä(€D„%ôæi6	m¾4H@¬( ÛÓğ¢B D‚H{~f‰R‘¤h‘ÀXÿ }(]|iÈš ¿:$ ¢ô¤xÜ…·ñ¢BgøQ!ÛÒœ„ÜoJBmøQ!ØOTHà64¤X†ÃD -ÅI:ıh‘€:éne@·ì¡18B niŒ®”IPzÑ!Ú8RÀç@Ş” íÊÅn”ÄcÛÆ³“PNäµøŞ
¨mœ„/Ö”‚Ô-ôª ¤ 6Üëûh‘c¨Èñ¤ŠhVÿ 0%²€Ûë@¯ZbŞºŞ!*q¾¢œ‚A³éD„®€™  .·#Z$#)Ìp¥%´-¤_öRKNb?}gj¶?º†R%ct†ÜeÈ'…9!ê0/ÏáH¤Ãˆ×ˆ –ä[Oœ‰hoD$ pÔRÛ”rl-D’´ËŸV§ õÛRZß
˜{A4¢B`‰  ((‘@íAB*…( pÖ‰€Ú8š$ 6şú+‰àh   ]hmH@é@0Ûzaz íHb°áL40"ÂÔ@h;_Z
…!&‚Ü¨
`ÜæáÆ‚fv¤q¥#ÅÀ"œ‚¬ËN´ m¾¦”Ö@‚@ì9PV‚üoÎHÀÖWqí¤ÒI:!ñãÒ˜I )­oˆ Œ¬ºşÚÉB·
dŒ)ãÄÓ‘¦6§"°:ıh‘-	½ZÔ{u¥%¿…!¯
$ …ÿ e\“(fıi!69ÿ Îœ‰!„×_­\g:YlzÓNFÂÚëND†Š@”ZrÓ~?:ñzEltü(&S[ŸÆ™+q‘ÀB€Gå@’‘méL˜¾:Ñ"…¶‡ñ ´HŞ£Ú:P8ÚA+NE
Mí·şˆöƒÂ€ñ¢EˆöÑ!°á Ú(„zkNB¢B¶”„Úrh‘ÁÆƒ8krVáAP0¢”•°<(‘D†Ózr(Ô{GÎ”Û­<Hí§&0H/ZRj:’(‘$-¶>4Ô0·#Â µÍÇ´ €?Ù@’döƒÆÆ”šGÉ[ANLÅ²úÑ#ÆBÇ
°øĞZcµ"àDs¦EÂéû(¨'^”Õa²ÃÆ‰:aç…DUt¤ÙµRb+¯ï¢FĞm õ¢H…"1·:r,Y=¤-¹u©“D¡mÅ92ƒ)POë;]d6õ † {|54Ó2ˆÚÜjŒË6X^¦Mnœ©aÚúÚ5!·ñ¢Hh–ÛÛN<èLX‡¥nWıôò±í#û(‘ªÀm×áD	m¥ ÃmôåN@D^Öä†´Ş´¤¥P"úTĞ=tİ<zS‘@&‰
êu×[Q&zŒ­Æ¿…	„	TN´Û
¨]t&RÅ²Œ…ˆÕ:ĞÙU_"ÚoNI†¦HÀ½))!í4Hà6_”¤1Ã×‹k^œ„ÓD†!°õ¥!ˆ¬GdÃ
`[˜¥ “¦Ö4H5 ßNtäœG´¯ˆ©’â°éûè‘Àl<'V+/@©‰¸_ˆ¤`Q%ÂxQ$$Øˆ±á¯:d5aN–Ò”š¥ öÇJR8[^^
E¶ç†´ä'³­)4‚6é¨ –Å¶÷#‡Òœ’ë:Œ¥µµCLVÓQÎ‰+ş¤•9ÒltCÛm9ó¥&„v\éÉ“ZŒ-¸ıh’–´Æ‰k¨Æ¤éFCtµøR)h"¦÷"šdÙj8(‘40§çHiaçD•½©ImI»EÆ´äíP!…'‡
$iI;\ëÂ¦ME¸SDØat¥#KC®l•™Ó°öu¢AÖAA¶´É¨l×åDŠe–Ó÷Ò4ğDtÆ™	ÈÂŞ‰¦¡±©ÉO@ÚoA–²;ğ¡¶€Cœ±i6‚˜¬äv¸µ¯Ap£QZœ“à{A¥#M1Û¯
#²Ü*¤ICÓÿ *$«!úPÙ	°¥#€
(l 6Š$ Våj± HÇ¶‰¶ƒñ  vÿ  ;@ÃaR”)H@€¹µP‡@
Æ€§˜ İhÚ€,/@7 œù[N@¡¿
$–µ­ñëH¹"VÜ´4äÊÈ’ µ&ËI@íAA¶ÿ ”¤MHÂÛ…9¶õ(‘1 ÜŒF€OÀ¶ØëDŠ ‘[4“)ü€H¿KPKÔŞTäCÛ§î4¤¸ºÚÔI02„(h6/o=€-ùPØ 6‘Ê‰ÓÂÔH@Äg F:_N”IJ²=¼¹R‘fHÚ·H¢Ø~I02ºñ¥% °½A¡1î†ÃÆ‰$[5¸Ò‰
 ñ¥&›!æE9%¡€ÂÑ‹m‰uì; leoñ¡0°ößKiNLÒ–H-…IªP –ªÈ•XÓÀéFBiM|)É8a¢G€Xj
„†J|)Éœ1… Òu€µ]–€W¥4F(6aJGZ&=¢œê-ºxÓ‘@¶Ğ	HöxÑ!´Ñ"€
M8Szi½ùS‘@ö6¥#†0·åÆ‰H V7ájd¹]G*r1í&Õ28r ÖùÓ™AmmmhXí¤1Úÿ ºÁkÓ€Ú¶‰Ê†å@Ú‘(’qÀ5µm±ëD’˜¶®´HšØ)È@öoòµ).l±á¯$ˆ‘~V<è)°U{š
Œ€tìĞµ… nuù$¥¨[‘ ˜­@à^¿
$ {OQ%jHà8ğ¥"Ô,O+Ñ#¼2FJR-¤qãÊ˜@ÂßZR8§:Q!ÙD„İ~”HÇ°~ûR‘@Hà[E;Ÿ
 [u§!È
RRĞazéD‚Zêßé@í¸m°áJI­§ÒœŒ‹“jÄíjFœ/@’Ÿ^uI“‚$ª>t¤¥Tƒn¶úS‘Á-¦‰¾´ĞèşT Z‰%ÖFp¢YIn´Ó#ÈÂ•2áÑNLâX¶Üñ§"h{-ÎŒ‚ (çÂ”„i½…T“N”²E*¶mÊÔäœXm=(†HÎ¦Pà ¿Êœ‰!Û‘ a¶ôH@XP±ùĞküh +aÂ‰¨<hbSä6ë{Ğ8Ö@Š……ïmyÓbP;i{ëH© ğ¢E*9Ói  "&˜ö”HA¤ğ§&z’Ú-Dk¹§åNLà•­­!€MztIj¬dñ¥!mm9è6ê4Ö‚@€º‰ DŒ6øQ"Øq¶”H@¿…)íçkøš$p<mD€¶õÔĞµÿ ²€[‰ùPj {N–¤pµuğçD„e¾HbÅ·™â(€Ú9ş¤p
$1œ¿âôäX±…µ¯S%@m•9AakR„yQ!·SD€Xõ anTH@nTH <([ÃZ ÆWRmÎ²“®È6Ó‚[E¸kJG Úšm„@[¥2wZ~ú	Ø`iÂ‚’QjR8#b>5RCĞšş5,ªˆ­Í4È²Ôa5½ô§Õuu¦™6Z’ /Æ¥¡})L¡ãn52U‘¦Hí¥úñ¡‚$Fºò «nt¸¤([S&jyõ p Amn8Ğ @¦˜@íoí¡°Hei@Xt @qçNB ¨µ‰ÀÂõ¢AV`åò¢Dê™+páH¡[—Ê™6Ô`q"’ä {/¨Ó­	’ë;)çNEPØh’]E¶‰'@r¥%¦×÷P +}9P-£(µáDÃ—$P‡bi ëÂ€µıôä  ^€ ?¾€€Ú>t!íùP;¶ÀmëÂ@¿Î€§— ¡¤ AoL ‘CÊ”Ÿ‡Z$P=¦‰ S}iH$-—>ä aE©Hà6iD„Œq½<T J$P0½>”¤pJ$  ·
rb<íXŒV½íÆªHª$¿²‰- µè‘ã!¶Ü(’Z€µµRµô¤&†Kr	B¶áD„¥õ:SÈN²0¢ÚRK@µşTä†H/Î†Êªh{uøñ§"² –RÈ”‡´ğµÀ
b_OÂÇ·Ã…9¼-H{…‡ÆÔ	TÈ#aÇŸJ$PKnœ4¢GÚ9Ûñ¥!´NB´t¢B`¢EˆÂk¯Z$ 6áDc[‹ñ¢ItR2–áD°\Š$Í­IlÒ‰.4ƒáD†!¶Ü<Cm,G´|è‘â˜¶¼u)' ÛÈiNF½µÖ‰¬‹e…è‘:À¶ëáNIJ-£âiIl[EúQ$@ö…¨‘ÂÁDŠ	n”!zzşêr< ¨ä5¢E ´¢C”ùxQ"…·
C ñHÑNBq¢BG*@ [ë@@XÒ‘†Ò8ı(Z˜†Fœ)Ñ#†-¦şH 6kD•´
R=´H@mé¥=¢‰Ñz$!©D­ÿ *RP­z>5’gM”€QNAV­9)!í¤p<¸UI-Ú$ tÄŞ°^Á+i~TH4˜Âèi6†Q!ÛD“ˆíáğ¦IÒ”‹;[Ja FºÓD±íÒ”•ˆZœ“¤:…µı”ä V¿*rNãÛmiRç…9$€<*FM11[OÙO Ñn¢‰µáÆ‰…µ¢B (¢X@íJBTpµ;Q! @F´H@m	„Â‰Ğiä=£û(ÈP£!ÀS’Ô¤B°§$Â$ şê–Í*…`xŠ%ƒH)‘ E ĞÂó£!âGJ$P‡·¥„iÈ£PÛ~4HŞ¡¶‰& (¢BjC¾4H 6Š$H6€oD!Ú…¨Ú€€¥!†ÒuéD €~Hß•$Â·éD„¨>¤ [iäiHà-§!Àö”6‘Ê‰ Ûz$ 6ô¢B°šR8ŒyQ!<k&ÎÔ€­4Å 5Y1…Ò–C€ÛNE
EH-ã§
b ¿Jr<I ¼)j(  vÔt¢E¶‰#Ùÿ *$P+r-½Eè“4‡Î‚ÃiéD„!°¢IÄ{OQ#7Ó9%!Û­"˜Z‚d-¥¬/†´1 ÛÊ‰¶Ò˜‚ßZµ +_åD„ ]iÈ dÛ¥"š¹Úâ…9…ëNEÛD„Ú$IHm¢GÚ8š$J¡oÆ˜mçøS°éJFÚ ¢‰!·­Hì-q¥9G:$˜¬<iHÂ×4H‡:rÂZ‡
r=¼íD„!Àö›iH@mä {zŠ$ 6NBôÒ”‚@ Ö”°ôµ)*AáNE‚é­)Áj$ Ã¦Ÿ:r,XöR€*>¤p/LS‘@ín20·
;PntH@[éH auÒ‰fİNºVRw@XóäP09ò¢F1¨ğ§%%(-øQ"ÅÚrD~hí?Úh‘@é€íND;t¢@`^ÒzÓ ,iÉ0><iH@Å8}h€ PšaùÒ‘-Gn£Z$p;\Ød@§$D’ÚVö¥#ˆ	(M	ÈÅéˆ-Êß::ºÑ"€+í¡0€º\ëNXÒPG.4›¤–ËÒÈx¨éU$ÀÀÒ
Ã—Ò€ANEÙÖœ -µ¢B	Z¤—££©Ép¾”¦´ä› 	}(‘:f—¢E€öŠR)¢‰Ş&‰ß
R/NB`şú$ \h€Ú(‘¤‡·˜§&‰ OzRd=ºøÒ‘ß* -~T mù
$VÜ¨€#…)mcÌP"ÔHD [ŞôHà[uıÔH@X|éIo`ÛÄÑ$b-¦‰ 4¢G{M¸RmåL a)e)šxQ#•¥!'i5œ¸Œğµ Æ‰í@ãAŠlU£¨‘@È¨MƒH6Ÿ•T†#·üè’Æ‰kÂœŠcDkim)È -D„!mĞ$1Z$ {EíD„Ãû¨„=£•xQ"‚AOÓJR8 §•mÂ‰ÓD’Óa´ßÆ™.°=´IJ²-¶§2K¬o†”¤q!@8Ú$ -Ï#½u<¨ [EéÈ {yÚ‰ÑÆÚQ"Ä,(–iÈ@íoh`~ÊVËó§,%]oj$›WPáDG°^Œ˜àeÀQ,N¨[E¯NITM NtI)‹Ò‘´ ¢öçND‘+CãS&ˆ-T™Àm4H@m×ãÎœ‚D¶ô¤1Úô†ƒmÍè‘´¼Ûò¢EÛáDŠ·­)*kQ! ò¢BcD„N\¨‘ÀŠŸ(§GMiIP„T^‰ÑD„€áH t¤p+Z‰ÔHà(‘Àˆ¥! (‘¤™Ë¶¦²“»Pµ9#µ)ÂúSi@ ÿ ;x^‰'Âœ”’·åD“jŒ-ˆm?
yí£ Å†Û›r§‘8’ÛËğ£"°ÇZm’;táJBm9‹r¡1µ ^‰À¤Ø@[¥9İh…¢GˆíD†" Ñ$º¶0§[ĞØUmS¬…¨hßáNHU*@ğ¢FÓB±åD‘ ğµZĞah‘ªè+NHˆºP	I-º~Ú™-­¶ôäˆÛQ"€Û©4H×¢@DŠ v½)¶ŠrKh·
R8©É-­@Ò€+JDê+©"kTÊ)hKm)/Zœ†!kò±§$4 k µ9%´súTäV šp¢C#—ãFBhbß:$<·>TäP'[Q#Å†ÓK!@ÀøPØÒ$EÍ)Zˆì¡±@­D„¨xRlp-¦Œ‡¶”ŠgÈQ%bt¢DĞ}
²JÇ…L—ˆ¶Ñ!ˆğ¥ ê~tIJ°rÒ¢N¸¹Q"ÛZ$ {n:Ñ!n UH ÿ HA¢BPuª‘@À¢A!ØéøÑ Ò”„Ôä v4H@í§(a´éj$ŒXöê4¢FêĞÀ¦RAj¶à´`uçND0¢B¶‰©H@XSÚ‰¿$tãDÏ…9êiH$GÎœ’Ğl¢I‚A@©’¶CÛ¦´äq"ØxÓ’1SÇŸJR6˜m¢E´D•·î§$Ä/Ê”„Ê‰¶:Q!·[Ñ! Aå­8tH {~”Hà 4H 6Ñ!ˆm¢Dè;R’ `Q!Jê 4ä–µ©IP=´H@n'…$ [oÎœ‰ÖG´zQ"u (’«Ú/JG´ëD“mNI€·Ö‰ºp¤0°ùĞ4¤v¥ ´tHŞ¡´ñ¥! ­9AjRP¶ÿ mJH4´ñ4 m¤Û@Ê$pq5³“¦FœoD†œ“½HQ%$1ÇÂ‰‰ó ”=AµPìŸZ$˜|ª¤MÔ¤x€ZrLåJJÚŒ‚ûhL •ºğ¢B -¾|¨‘¨4Hd-NIh6<èÅ-øŠr(6øS‘@DŠ·•)) ıÔI00 r8ÑıôH 6Ñ!ÛÏ;Q!´Q -DjM„ãNDì)d8u§!ÿ ‹Ñ$4;u¢KXÿ }&‡ËZr,D<8Ò‘@íãDZœ“jR<B‰è€ëD„ ¢BD„‰P8;ó¢E¢BH@ZôßJÖ¢E@ÂÔ‚j é@àv5¢B &¾¨‘*])Ixm,BÔ¤x[şú$P|(‘º€Z$Pöí¥!·—*$¨ÚR=´¤ 6Ñ!Ÿ¶µvb>¤ z© QD„"\N”ó¢B*r(9Q!©I.£ãNJ€¢DÑ"ÄtHš§ ‘-4<éH4;iûéÈ‡z$ >4HJ$PäX”NF”„9&	”¨‘HôùQ"š@SÈPRĞÇ§!j$ >4¤ -ÈÓ€"úÓ‘c h€µ)¯M2Z½xÑ#Uí¿Â”†2m<„êG†”`ıÔ-}(JIµ,‹Uõ¥4O‰§$¤¼Œ-<‡€$–€x
‡ÄŠ$ 8xÑ"€ùQ#ÛAJGñ P;ŠÆ‰-)*ÆıiH@íD„ÇåDÖãD„ÀÒ€Ûjro­)Ä~êR8H {zŠ$ ,(‘ÀÂÒ€°¥#€µ9¨ƒÍkszÎNø$)HïL˜í§! id±ßJr<Gï¡0Ä`Ó’"~\E)Ç
r;ÿ u)#ª”Lœ„ÀÅ)%¡‹ƒqNDª=8Ò‘ÀÅè‘:Ó’Zµ§"€·CD„Q"ÛÆ”áD„*$ à(Ñ!@€xÑ!Ö‰´ñ§!có¥#‘Ò‰" Š$–‚œˆ9P˜@ÿ h¦Â‰ xŠ >H@kD€è
@;tçJC%u½<‰Äv¸Ólp‡nCL”Ğ€"œ‰($œXìyÒ’’<„êhÈJ£°Q%b¢IÛJR§! )ºøÑ!€şú$ `s¢G¶„ó¥! ‰¨€Ò‰~&Âo*R8 ?
$  ¢@våD€Z‰ _h‘ÚR’ômÖ‰${¾”#Ën×•œ’C•¦šdã¨ôHÚ%ì¢EiÈA+Š$¨AsA8u¸Ó‘40A!ß§
$Mr(<è‚@Z$"F)È@Ç
R£§$4;Ó‘â;Ğ£½Äÿ :R7QƒNE§Jr(C¥"u
rN#½)Gğ¢Gˆ\Ñ"H9Ó‘A!øÒ’±OÂœ“ó¥#hw¢E¹ùó§!(ïğ¢G¥)‡9…­D„
ÆŒ…ˆXŞ‰BÅß
R<BÖÖ‰PÔŠr(
$ ?”H@ìxr¢Gâh‘@õ¶´¤pä (‘@íJGV§!·*$X^'åJGÖŒ‚j$1½8Â”’êH$p1oßD‚¨
$X…(c)*¨dQ%@|5¢IÄbÜ¨‘â¥"Ä`k¯$HÚ…)Ãë­€ì?¶”„
Ã¥xÍÜi¦#İõ©’ –ı>iÉ’JG-úP˜b0ÂÖª‘CCİJAT{¾´ä1ãÎ”Ôw§"ß•(?Zr,In4HÀ0şÚRKDƒtşú¹§ ªJı(Ä7}(ué“İøQ!Ö‰İi¦'Qîı´¤pJôäMúÒ lF¢ö¦(ùÒ‘@õ¢Gˆ_åND;ğ  70î MHn¤	@î4¢E~´Ç/z$1é!só§!ˆõ¥$@_¡¢G¿Z$PúR’±Çr,Gp~4¤ ZráNEwãI±â0yÑ!‡
$p¨‘D†ê$X°İD†,/@b0hÅ<Grh‘5 (€ñ¥%*ô¤P;Ñ"Şôäx’“bs¥àbÔd%P½©d84Hà/FBŞ‰ ½0~´¥„ÆŒ„ñ¢BqøPÂ¸õ¥!zrxÀÓ=v¥J‰ ×6¢T>4†Énè5îx¢EˆÃ‹Ú€ï¹·*’~TĞ¼’)	©j©'†ùQ!ˆÃ´·ïëÇ• îêj¤P0ÜèlPKv”&'Pò¡°Ä{¨Ä{©Èšéd=Ö4d<Cu)Qîñ§¡Œ1¥#Äa©{­V™0-ôäx’€¸)H@_­9!ßÆ”‚¨_•è‘b;•9* 7Ö¦DïU"h/FBÆBã™£!@ï}j[4ÓC½¨”8Š$XŒ)HÚüéä,PéHb€ó§!½)
âœ„ÅúÒ’ tä¬GáS,P(Ñ#€×éH w½ ¡„½
 /@‡qÎ€€½ =Ôèé`©î”H@n4üøR‘ï¥ Ñ ¨îñ¥!†/æğ­]!†·Â˜š$¯­ƒ¤mA-ÔÄ=ô CŞ~‡İ­~ÄH1åH bhîèhïã@ {†@Ë´Å¿Æô	¿:0ÖøP&¤{¾”İã@BÜ¹P}Ä{ÍÄa¬8é@b0ÿ İ@Io…‹ Âñ}i‰ÔwúĞHôäQ#†ázR,F•h7kz$PÃu<CZ$xÒ™8†ı|9R‘â=àÓ& >œhH 7Q#€ßD„ş<(óÖ‰Aº”‹†¢GÜ)É8†áNBp¥!º‰ê@oÖ‰p  {…0€Ü)H@÷R‘@÷Q!İJB=ÔH 7
r=Â”„ê$PéH@¢B”„ëQ"n¥#€ßD„ñJB¼S‘@oh‘Ááwëã],ôÓ$ÔŒntÀ–ê 	n dƒP(CÜ9šCó  •üh ÜG
 {¨%ºÔ!†ñÖ@ÃÛû*u05D0Ë ‰·:@ÇºÜéˆ~¡  7øÿ m ‰<iŒ{è[ùŠ=ö‚à–ÿ ­üè€ñ@-G¿çá@0H}¨ú”¤¼Ğ( àS#õ)Ô=h@$ 1{ó¢Ij¼PÀ¸åÆ€†=ãç@ƒxëD¼PºRA¾„Á¢[õ¦KA¾”ß@@ 1©@±©jõ Ä{Ç-hÄ{Ö‰wáDŠx¢BºúŞ‰ñğ¥"€ßãD„uüiH 7Ó€ßJB:$ 7õ  {éÿ }¸P=Â@nhŞ4ï­º”„úRxmÀ]°ÎùaıÔbCd·éNSâÕ¿ü¤öoô£Ü#Ú_íy~ã÷Óh±aÃY”:£Ë"¾éŠÛlkéWNe;Ü¾Êãx¥,õŸÑÿ ëO·¬£/¸ö\ŞÛ›Ûcî˜9¨8šRŞŸ§–Iw*Ü€^c…+ñàmÃÉØ‘Òı*Ql{ÏZF(€õ3D’õ4ñ¥!êpÔ<E¡åõ¢#õ?­HIÖ“¨HıM|(€‘‡×¥&KÔ¢ÿ  z”b	Ào4Ò!±ïÓáJ#õ)@HÄ„Q!¢$½SD 	H¥%ês½(	W§¡ú§­"†$ÓSDä=ZPZ«Êˆ©@–ã544)PSR”bAkÑ Ç¾ˆ‹yëDGêR ßã@~´ o4 ÃĞH÷}(’væ‘P?SN•DâêYHaéÔÿ P1%¨R†?PR%õ)0úšR#P,@IÌĞ’õ(!¿ëI‹ú”ƒzŸò 1%¾bÅß~v¦8 ôH@÷Ú‰şH@÷ëDŠ ÉJCïùĞÂ¼
A.Åx=æçñì:rŒ»°HÕÍìª	6tRYcú•ï˜ÿ ¦ŞÅîø›ıÅ{zÄ11ì&|‰–C(AbY…ínœdàv·]rÜş^{—Ü¾é÷Gz÷7rbsûÆdùó‚Åö™Ü°P[RYEù
ë””#ÉjÍ»5¹û;ÿ ±/j÷œåŒúN"2‡]¢T;Š”¶âJwaÂ¸¹SwG·ê´¸Û?Q	>u®&v±/Pò¥ˆ²A¾"È~¥Aê_,C!ï¥ˆò~TİBG¾Ô*„Œ?:1CßÏéKä=ş:Qˆd1':1†–#Íõ-Î–#ÈıiÁ2˜÷Ò‚¥ÿ ¥8&­ÿ (‚²Cß¯4AÈ~§*X†Aê_T#ßĞÒäÇZX!ïKÑˆd áKÈ=AF#ÈbOì¥ˆÕ‡ê}hÄ2SÆ–#È~§¼èÄRƒÕñ£ÍJ?ã…,DØ	†ºëO;­ãF ®‡ëTâ^€&µƒcõÿ ºŒIL~¸£ÈzÃ,JOAúã‘ÒŒD€N:Ñ€‰zÃ‚r°ãKÈ~°ëF"È=oX–¬¿°vHbaÂŒE:¬øÑˆÓ[ëF$d?Z–%d?Xu¥‰hb]t¥ˆ›«I AêQcõE(ú¼¯Jõh«m/¥<CÕñ¥ˆz4  –ÒˆF$¢õ(€Ä~§(!êQˆz”!êĞ‡ªi!êš 1—…è€Äğf`õÖ¾›ÌÏSæßùùÑ¯sá/x‹±gÉ3àO>Jáœ‰±¥Y¾ÑX²¶é0
¼t¿–¹]’²4ºnX?v¬O{ökKı=î2H½»ÜòGßåÂiŒ‘cÇÛ¢”ŞHõ
ÎòF^Úh/sYrr¦ò^
àà´büêCº{Dd{!ñ;goLí‚cš9Qo;G-‘cÄ‚£qã×Ù}ĞŞ‡Õ_íŸÿ K4¥Êü¼Ÿ¥ÿ ğÎxÏôç»G?ÜÌªu¹S
)=½­^û¤Ù?¡ò¼W6¾§èá ·×¬ŒƒÕãGX»ı^WáÎ“ã`ı[ó£¬ĞÌ§­.±æƒÕñ¥Ö'È?VÜô§ÖOc«sK¬®Á‰oÎŸX»êøÒëlb[
:Êìd½cğ¥Ö,Øız:ÅÄÔu\~¸½.°Ì=ZOŒy’uùQ€+‡ª)`Õ`‹Õ£ä­,IÊGêÓÄ€J-­,C$ƒÕáOv«ıô°aë[ÂÜ(ÀyÕ£.@õoÎŒ°=N´b,ØzœèÀjà%éF˜z‚–ìò8p¢	È=CÖŒC!ú4`Vbõ5–ì«Îô`êxÑˆ+Õµ,ùêŠrMøÒÀä^¯Ö‡@Wú¾4°õW©§ˆİĞıZN‚W(æu£»ê?W©¥YÕñ¥€•ÇêÑˆd_XØ‡êıi`W`zÔ°+±šX[×4`Wf£õê:Í3_ÆŒ!úş4`‡­ó£f†&êp)] ˜e,zÃh~®´°D½Q×NÊCÖhÀ2¬9ğ¥€ä=m8Ñ€Hzş?*0a’Züé`ÂCÖb4ĞzÔ°`Ú<4­öYd(-´±úÀµ8ãÒ¾³KUÁóĞédÙùŞı»´û{İ¾éÅíıÂYò;w›/'¹û¼Í’…–ûåµUI‡Ê5ëÀæìwKÁ´¬š_'‹ö¾lïÜ}Ç¾æ©BğäàaÅrTÃ+	XØü µ.Z:ÖsÖ¬ß&z¿gI/pˆ“±Y™T›éqcÃÂ¾š.§ßzo/Rú»Ú½«±önË{o¶cvÌ<‘÷Á…Š3+şvÚ4=+í=[ÖÕÕË?2÷ø­K´«ëúäsú×£ã»ŒdØêiu‹·QıÉ<)u‡oÀ}ÇCÂv É+}~t°'´—Ü’xÒëÖHäxÑ]¡÷ ğ4`¨c$t`„†@×ZNƒìC#­,r’û4½üiuòr|u£.BC$Çñ¥€ÕÃîEş4u’îHeŞÿ *OŒ}÷ZŞ÷£¬ şìu¥ÖSå$2Ç6©ëpû¡×OÆŸXvîÖÜAñ½.°ì}Ö‡_…aØuqÇQGXf/¹ñùÓë`ÎPá}(ë%òî‡Z]evè/ºÒŸX»@dé{ıh|cì$r€çÆ§¨$İ44u³@û«ÑÖO`}Ğ½
:Æ¹I}Ğ©ëhşéxŞ¢»P}ĞáÏ¥dö‡Ü
0+±îW­.°ìCûÖ°|÷ su‹°baÆ–ì\|èÀ;×hÀ]÷±öN:ÒëÁıÀæiu´bqÖ°ìAë­¸ğ£¬}ˆp8Òêh}ÀëK¨®Ô18£¬ zÂÜiu‚ä%ë_¥]ë´u°~·,˜ı_]cì\_bì¬:Òëcì­ãO¬]ƒõ‡*]e.A™©u‡`zÜ¸ÑÖ<à~µ.±öÖ½.±®@õÏZ]evÖñ¥Ö¬=o)u´Æ°í«ÔëSÖWhz¤ó£¬}¡ê¿*]cí>'mï¾×ö÷¼×ºgâ÷á,½Ãºb.<rÁJİbq3\n°ß°íÚ½úÒZú#Ë¿6YUÄî~c÷4ås»§»;?§—îÚ`Ë¯ÀEPukyò¯2Î/ø‹‡şß'ØùQËÜqûLĞË2A&N$“#zyX¶z·†Ğ€k?jlò=u8ûÚ}Û/,}´°Æ®æé*’Û•w¡åá^?n`úŸGÚµJ©ö¿nûcÜx“&pÉNÆí®Xc+ÆìUİˆ=C‹k^×§é_GÏ}ÃîyjÏr¹óId(L¦>å€–Ş`-Êõõ<-Vñß³Wy@2ë~³‰{û¾@ÑÖWz›ãó¥Ôä ûÂEş–§Ö5Ï#ûÂ4¿Ê—PŸ8¾óÆŸQä†ôºŠÿ  —ŞikëK¨ä€Íå~ú…şI!šx^Ôº‡şA/»=iuşAÈ÷o¾}·ì/oKîŸwf¶eh±¢ŒÏ‘.DûŠGJAv²³E”\×/+T;8~³¡§ÛŞêí^êìÑwîÈÙa3¼^v4˜YQËRË$2‹Xu ‚>(¸ùêøµ:_vxŞõ¿YÊ¹Àe›ñ£¨ä3–EÍéu‹¸İ›q¿Æ«¨;Ñ!™Ã_.¢¿ÈŞĞó£¬_ä@ÎgCó¥Ô7ÎxokÒê%sïoÎ£Nÿ ¨Æa"—Q=â„xÓ|AÜ3K“GPûĞËéz:ƒ¹ï]iu¼>ïÆ°îå‘}h|aß†×½.¡wr3ó¤øÊ\Ã9G®”u‡lîˆçz:Ás€ËÒÄğáIñÜ?¼=hêx}Ù<éu¹’9gMhë'¿ê-‡:K˜vÖÒêÌ?»=u¥ÔOÔ>èÛc\ÿ Q}Óq¿Î²»X}Ù¿}f}ÃFüiu•Üß‘œ³®´u”ù˜şèvğ¥Ö.ğ\ïzOŒ¥ÌvoÆŸPûƒï­.¢{ŸÉ/½7ü×¥Ôãn:QÒZæa÷¤şª:ˆ~ÃÍå{Òé)sŒf·Z:J|ãû¶ëSÔúŞ‘ÎŸH—;%÷§®”ºJïcûÓo
]%wŒfµ¯})u	s0­GHûÇ÷§­ºŠ]Cîd†iÒççK¨®ò_{Â§¨µÏ#ûëñ£¤]ã¦—P×0ÎhëK¤®ÿ ¨¾ôe!Ş?½¥Ò5Î?½*]#î>]îlLûí¾õÙÒeÅÍî·"1<›car_mÉ[W£Ç§
³ğet­íu¯û#ò×z÷Ö/»°QrpÎ(í©Ù¼Ì²Gé.ÇŞlÀ¯™x‹×Îó]«3ë­Â•ï}˜¸‡Øxx9ÆİËoÇÜEV˜¹´d“k0ª¿2¹ÁN&zoiÀÒä€ÀPÈ ¶óæk[é^g3ƒÜõ“{ŸMÄ™dÁG£G<…†Ÿ¯mm_[öUjÁñüƒ§’X|kè±>'±¡>BÄ¢I¤H¢bB¼ŒM¸Ø±·:14£³>UïOë¦w¶=û³;³Ï¹ûtM‰pîpdIÍ‘š½,_/¢Lw±gÜ¬À‹­x¼Å•àúN/N¸m'×rUà£] Æ'*%@tó¨&ÄVÿ –àØšôxùÑâ{7ã³ø)•t`q®`3“mxñ¡P]&.Û¤éjV¬)/“'Á½Ûÿ ’½ïÛßÕÿ eö¯oöìÿ ovÌÕíSIóÌ™ãp“KÈÊ‰bv¤{­æ¹5àr{-[V}O¬¬¡)>ûgnÌÀÇï]¿>{.r,¸YrKbD~V¶ñùYGq]ü~ß_S‹Ÿí¼Ô¶›AÜûnVD¸¸YÑfO,³}»z±ª±Ú?˜·BoÄ)6®Šr+ìn7z˜=ÕîŒofûK½ûÇ2ËÇì¸ÆtÃWôÎDîë0ï7ÚGPM‰{Ö~Ï']~£ô¸ûlÛÙéŸ½{ÿ ¿;3ç÷ŞÑ…Ús™c^Û&Tœr±Qã$ê$S2<˜kÃêûJíÉìû‹­SKsÅÿ ][°ûÜvßcâä¶GvöÆcw<™¡™,yLªŒÊU½YÌU€äyÀùÿ º}Î´·Ócë>ÉöKrWWºŸNöl·û3µFÓç›ÔÈÈ—k Ê×(¡™¼©`ªo¯ö~Î×'£Áÿ ä­ñ]Us‘Î½åCã_+ü‚åa÷`¬=cÖô°y"r<j°oÔqãó¥€Ÿ#ÈëÎŒùZÜ(À}Ã©`•‡Ü^ô°h}Å¹SÀ]¡÷Í,´={ë­Å<¹’ß[ÒÄ¥Ê¸ãz0+·êsn:ÒÀ‡ÊÀNm{üèÄ+œ‘F|Ã“K®fÇëëj0+´~¹·Xµ€Ÿ©£®f?¸7µô£ î¸'¥€v‡ÜTğpÄìu¿Ê“ ×+cõÍïøRÄ}Œäs½åcõØóùÑ€û@NoÒ–!ÚÀNÀñáO.ÆKî[áK»XşåºÒÀ;XşàõÖŒ
í¸cFö±Œƒk_Âô°ÖpÔ`_hÆAşëÑ€v‡®x^Œ	ì`'?ßF\Œ—Ü\Ôº¹IŠX®/Zæ$»×¾”b£õÏüébƒ óÔRÀ¥Ê?_©µùÑ€vO¦¦ÔM$îuµôëK{F29Æ“¡k”~¿òÜŠŒ¹`~¿øªq/´"üéà.É\ÕøÒÀÉzÄó¥Š+°òwY³$…˜¢KÑ–TI)?+×U©¼	{ÿ  ™ùoÙ9™^ÅíŞäÉ’>Åİ2–»lıdÈÅ´SNî@R'‹ánò^ßŒûî/qsqW_Úÿ ¯“ÒCÚ›¶ÇvË”ÃĞOK¾±°ºØ\è†¼ÊIß|ekàô¾Ñ÷j—*H2ĞO >}ñúÄÓuö<aÉyGƒ‰$œ§·û¯Üòö—/<«,[·,›ìV[…e'wú>Ãâº8=ÿ IsñÛÉè;çrÄöş&_qîËbÁ7ÈÆÈ›šÀn#‰¯Ñ©ÈS?¿®ëÌëğ~c÷oõFáİ%Y{šfw†`úÒâÃ¸°)¸j›_ÃÍqsûµ¢g¹ëú
ÍKÔô^Ö÷‡eƒ¾öv{Û²éß{;CÛàƒ$)Èg°Çq»lgÒ}Àz·eC+åíî>Kµ_'ØÓÔ­h¼gö¿fîøîouå¶_½½Ê±IÜáP©‹ƒÛ@lJlYµ¿Î¾ŸÔãpŸ„|'ÜùÒmoknvÉ7½õ¯M9¨aL5G/İ=úkû?Ü¾éÄp™İ—¶dæá9U}¹H»a;\6‘”Ø×'µljzoª¿&ç‡÷¿cĞîÁŞQÄİó³EN.7p„Hs%î’ ËZÎùKò¢¸·…|'±u~f¿Ô=Z[‡‚¶‰…?™¯Ú“¸eö(±`ìÙ=¯ÜK	Åï~æïXÒaãbfŞ§ûok%¦@ãdD{¼şb-^§©ë·½´øÿ vyßp÷#Æ±ıßì¢bÃ‰Û{v'hí±;nBXØï“b’nòXvbY˜ñbM}?
¢úŸ	íûVäp”$|×úç,}Ë²v¿dw3èûg½H¹İÆx	û¶“ÊÆ BÆ›·ğ%ŞÜëóŸvö]^›£ë>Ãé®J©Ùœ®ÙïŞ×ı9öfoö~gr÷wsÅUîÙÏ!+Ú£T†[îêñF^Ç‚×‘ÃíÖÔi3ê9ıñİJì|ÛÚîögmï°FÇ ½4™{ìbÈÊNCIè–UuÊÈæüÛZùÿ ¸z¼œµqúÇÛış>ğÔıIØ2ğs=¡Ú3;dĞäaf,™0M‹/¯Ù$k"ÉÌGmœ}Çÿ á|\1mÏÏùW°¹®š4ú†Öç_YÂdĞ÷ºÒĞy1o7Ö†“`\"›ójnE"²aê_áDîCÇéC@¬?Tÿ m,AŞş`m@e¤†ö¾§QL2‘ú„s½(´ õÒœ	\”?Z–‹È{ô¸¤9sı”ìî8Ñ õ@²…˜ËØ“BEL ”?Xƒ¸ÄšÚˆ@\ÒHoè¥­n4ñCY5±Ò“EU¯$Œ€q©ƒFÒr5ÿ ‹Ñ ›€İsûh3ô÷‰<(h{ş¼ê`™~|¹Ñ&]O;ÒÄ¼ĞıO¥'v/Sştà‰$ÇçI¢ëh%ÍÇÖ€µµ!åÀĞzÔ>t ·pı´@+HÄ—Ğm!êu¢
vú—¥Võy«an½iÀ³’Ü~T ©™T 2@d<Î”A96!!õ¢
ÈŸ¨xŞ¦
Vb­éÀI/Pó4 ¬Øz†ö¢z‡…É!&µ0Z´–ÜN´$¿È	OZ Y¸°å0É&ƒÌøÀßYr{5t„_ëÎ­cç9ı…ğ½ƒío`åÅ·¿ãŸ¿Ê6oã™¤‘¤Ê?ÉRû‚¢İ™Ï”-yÂ|ÎÎ§Òz«Š”¥·_ÆçS»v®Ûƒı+Í×Ğ“%1>çÄ‰4Û="„>ºò9ª¸«sé8nù¯¦ÇÏÿ ¤}­»—»q®7E‡å8`C(Ú·ã‰¯Ö‹rë±ö^ıßª£tŒÿ ÔÏeCı<÷2?`mÙ;Ôr÷,$¸\L˜œˆPÿ 3	c¤rİíµ’•ön\«jÇ÷&ÿ ÜúO~öÆ7õƒú_‰xaãwì|lÏºDf+%
Ö	ub.}w¥ì.^[ÕŸ}çƒüg:­,|DA=§Ù½ïÚ}™Ø»æfoºd¼ıÇ¼EÚ1ĞÆ_dQB^Y§·åMëæò€N£šÓğmêŞ‹U¿è}§ÚÓn{2O¼Xåï~æ¹/Ş{Œkx—\laº8m`7ù¤ÿ ¯OÖôxé«<{ïkOÌõmÎÅŞå‰»¹7:êkØWªÑ3j^Î^ç†ş°û›¸û#úy“İ»nC`÷~ã—kíÙë}Ğ3«M4ˆl|ëd.Ÿª°äåVx¦{?oô­jäÖ­èsñ?¬~Ú…=ÚûÑ÷®ï¾ãÊI#ô»\ÇlùwÜ9ùmµqÒ¹+îEšø;=¯µÕ4ö~O¥äöŒL…Íì¾áÄ'µäÃ.?píó›G<AKø‹î*6•<lEt{<ŠÜR;ĞàtöUm±ù–Y#ÌÆİálˆT$˜ğäJûñåQü’¬Zé$ZYº‹WÃóñÚ·lşûG¥Ëëat›…¯™ÿ ƒİÇıYş£GYkŞ²#‚<qŸ.4+’‰•dI%®_â+›üçM+ûO+ßÿ ãÜtz5uô…ÈôşÆ÷èî8PûÏ;íçYâwL»„tcc²¢¨+k-m+ÚûoÜy2‹j|ŞşÍÅ×5Š³Îÿ Yó»pnÁİ1;›AÑN˜ÎUÌ”ÒM…ükº¾ÆÜ@}ƒÿ ²ªªÕš>[‡Ü¡+ºcw~Ôgî-Š‘öüPÅ4	êß#(frÛYeÜÆ†¾w˜¥‹ÒOºö¯Ùi½\¥ü¿äq½ÙØÖlh;‡`3fwXñ—µå”dTÉ”“°äT;ªßò‹h/WÅì<š·â¿Éöı*â­Ç«ˆ×ê~şŒvéí¿é¾/jî&i¡heˆÌŠ»á*…H½îC_KWÙıŸ—9kcóïşAë¾.4­¼Ø­µãÒ¾¡3àä\)/$â‰æ‘cní µE¬ª¥›RÎç#µû«Úÿ »eö/o÷ü.ïŞ0Q¤ÌÆÁg™Qb =¦	è±BÃvÉ¹)îRÎFÿ mäU“¦ÂÖúWjry8b¸¦1ßCøÔ’ÅnTäš #•)$/ÿ *°ïÖ¤tTD›‹h)¦M”l5·%jHhxÒ5«ÖÔó¢
Ğ/aa­» 4œˆÖ–Å7(ááM²RÜšLº©Æ·ĞÔê½Y2II×™©°Ğ÷ëÆÛ%~¼)¬#}(QÜßóühŞ ÜyÒ4v$ãA/@¹xS	%}:R€éÃÆ‡… 0OÂÖá~$ë¥z€jpL’_L¤à,N¼úR’¡½F‹‘Ã•V€¹ã@¤/qÒ€_t€¢ç… ‰\|¨5”‡qÓåJ’nšĞ,€} ­#¿^zR€³<R`H½ÇÙH4ğ;Ûû¨hy4½èHVz çCMm‡ŒH UP,«© ^¾^º-Ï¤ä†ôGİ½ï°{g´«÷œX³LÍ»¶m¹dàÖk€ñsÂ¹y=§Gû^§¯éú“û”£âÙy>ûş¨Ì{_oÃY°ñH?íø(˜·ËëHx²˜Ÿğ×‰Í{òÚ~3î=zpúõ×uãÂüO­ÿ L¦yÉƒ#'ºÏ_uÏ
'X7,p¢j¨¬ö-®¥¬+£×õñs‘÷?¹ö¦¥úôßuîÍÛ¡woí’d:qLÉÒ:±\şÕ¿VzfªN~şgÛ=»Û²ûwµö¨ÓÒLLH!Ø€ªÂİw]Ş£²¤Ÿ?÷kVüÍ|îéìfw¬§ÎîŞŞí¹¹òÒeOŒ32ÛkbE…‰:Z»—%Óİ;¥†‘|§÷1Òß™¸9Bº«íŞ78­êQ¹}–`òêÉoÆ­{~L­ëÕx<õú?ìßêlı¯/¼ışrí^H2pd²b±fh	AŒ]›wªşFâÖ®ë'2uğº¤´jşŞÿ ÇÏéGbÉölœüÀwİódÎMÁvßÓşR/–Ì¶•)Ùë#äå¬í?‰ôl?lÃƒ8øxøø8È‘bÁél8£TBKm
4 p®İ"O?¯÷d‘ªg„#Ã—ÛU‘Ô¬É4),rÓóm Şÿ ÁğVç£Oºsq3âÿ Õ/l{3Ù¹sÿ L»{ùgÓÚ¥ûw‘à—nSJ 3Å
†ŞY·ZÇC\Öû{N[Ğï¯ŞÔÏî<ÏôçúuıTö“pw^Ã÷V[Ä®ã>p1;v­6>>6òÉ+¶Í³2è£òêoµ=~5¢qø^ÇÜ9í¬dş¯Çàz¾ïı9÷¿º»òŸ°ÁÚæ—³öŞÑì¸[?š\‘™Ü%õ“zÆìÊ¨İÃAzÇÚK·^M¾ßËjÙÙ¬^‘¯ñ¬ÿ ¡ğ_r{K¹vÜÜîİîNÙ‘Û;ÇlÆ’Tƒ$Ü ÊÛåGåÖ@.²#Ã¯œ»ëp¼ŸuÅoò¨ßš¯ü™;Oo‹#´ãÛ;z9P¡ÁÈF»,ŸÅºİt5ËÈì¯ªØô88xíÃ*ÛíøŸ¡¿ñÿ +7İ“»vŒyşë E•9Ò9¥cÄ¯oËå¸×Ò}«Úé·îÑ3âşÿ ëWØâx¹h÷³&4Í»¹¸‹ßc]ÏÚT~¢×ócïõšÛmí_kOoÛ3ó+}»•k ""úk¥«¦dåÅ­×‰İ`Êí]Ïrö¾á‘‡êâ"˜¹14R¾ò@]¨Å®ÆÚk¥sûVKßoãvæHüÑıö_¹û¼qû7¶}Wöîş¯r÷6G£ŒøØó˜V†k&0¾œk®¦Ú
ù^Ÿ.‡è¿ıVŸ'é‰£ß+º¨@X£€×…}$ÌùTİµòVbkğ­$Å&ôúRP6†"kp¤ØÕCÒ=>t¤V¨ı&7Ò‰6…è¶·4Hc zFÇJrBM ôÚü01µøkB ½6'…9CU‰‰µ´¤˜ˆT¤0cô›¥¯kkF€êĞzmÌiD†#ôÜ(”=@ÂÜ…‰Ä~‰·zRÈx‡¢ı>”òAƒ¢×½©d‡ƒ‰ïåâje¦1ÛE"”¢šlbè~TJmÒœ’êÉ›¥%*°ôÜ5éJP:°ôœr§!‹C7-JCú-ÆÚQ%*2>“^öøÓ’Zr?I¨‘bÃÒs­´¥(x±úL9Q!‹‰¸‘Cb†‹_‡Â„ÑN¬b'¤Ú*ªÄ½éğ©‘àÀÂÖµµ§"Á =¸iChjŒ~‹-JPbÇè/kD—†ƒôÜ(ÉÖÃĞcË^Td‡ÖÇöïÌxÒÉ­‡ Ã^tdÑ ¿Td…‹ÜnlO?Â–E:7¨Z›hu«$1ØkRìRãÛµ¸iK$>¶ƒøü)ä.¶yïvûê/lNøk…÷9~šÈ“Hâ<p^öÜ ,BÛ]¶¯ƒçötLı'ÑûräıĞyÁìlïwäuûß&I±ó©dÅ$‘_Ê	èÃoËyˆâu¬øøß!ÙÏíSÖQçøı¨âı·mÄ‡·öˆ¡ÃÃı,xbUE˜Úø›šô©ëV§Ìsû÷å{è\­™.­?P·kwT‘Í6gÊ=ãÛ¿İ«8xZØ²7sÆÒ¼’r·!_9ì$ì¿ï¾İgN7ø#ìÉÛyÔIĞ_ZöiTª‘òÅínFÍ¨!qµÔñ-À–¢81î&u?ûgÈÔÈÑ†xUISåaÄ?ª“tŒæ tÛ¯…t#™è-Š|ÄpıU²ĞÂÚšbœ¯	Y£#ô±_¥î(ÜmÁ‹+3¸n0£YÍvàÁlo]ªG=®Ùƒ³öôÏ=Î<(S¹”ôşôÃÜï}‚@·U?Â¦Õ»»jÎ¨“”µù;PcXX(¹ÖÖ½FFµM³µŠ…#aUqÄıÆ¸¹5=?Ú~Fÿ ÈOrv¬oëœ]¡ì]¶i‘INí,r‰‘Ô§­x¾ÏÒ~§Öı³ÛÃ’Áùw¿/}ö–~_lƒ#'³K4Ó`r!“BH*ÃK…6`5ÑÁZr){˜{väá³Jqñø«?ñgº÷i{'ß‰Û¦È÷_jí’÷,ÈPıä™0zšX]™YÑ¶‘¯u•ê³¯Ä’ìúŸÏñÿ æ|CúşíıDNõßbËÌ÷¼}Ád-—’¹Ïy„³M)+½e_9%ÿ /æ®îN[Ñ¨zŞ—êİ”³÷ÖmŒd³®‰!ß¶Œ¬t"ü«è8=–è˜÷}J®WË¿«>æ‹·®O±11Ó;ı×¸°.èÙoº(  Œ¨=[ùµÒ¾î?q²Ûò>¿ìŸi£zé¶¿Æég»ı»ÙıµÜ±=Ë–½ºl9bŠ\`¦l©4rÆ(Pp1²sÜ+CÙÅäµ“³ï¶uÁé¯À÷ş×îı³Ş‘{çnULfšHWÓ“×ŒªX©Ucb7ìº«\<ké¸½«7©ğÇ¥ÇZÊ:ç!ÖõÓŞÏ?üd#ƒÆºÑŞÊ~µPşÊxşÚæ>„cç§ì£½‹üzˆáB·§ÜÃüzŒáB~tw0ÿ ¢û(yjhîaş=F0áF¿;˜º*?²‡µáK¹üzÃƒéGsECì¡ãk>æ.Š‡Ú@?¶ü(íbé¨şÎ6úš;˜ú* ?-.Ö¶€e¸<híd¾’û8zqåK¹”¸*%Ä„p·3Æ›ådôÔc¨_Òícé¨şÚá¥ÚÆ¸X-kkâhíetÔm|)v²zª.œyS\¬¡)ö1u!ı¼6¶İiv°ê¨h¯ùxÑÚÇÔ‡öĞñÛøÒícêAöÑù~tûXúª?¶‡š^—kâ¨zíüºó·*;ºêoâ¢üìiv1õ ğù>7éOµ‹®£ûxGèuåKµqT=(5;¨ì`éRBè¹â)v0ë¨htÎÖ£ÑĞRt¤ùXúÒğ”Û`¾>4v1b‡è@¶‹(ìeaRC\Æ:ozO‘­Ñ€[Ê/õ£±‹
’lx­u@ÂÆWZbEüÜÆ´v2pR3(	eGjY°ÅÄ@;©v2±_öÑŸĞ>”v±õ§àBïm‚Ÿcb_o‹ÃZÆ¢_oìc·ï¥ØË\h:[ı1ğ£±­B­¡ŒiáO6F)“ût u"§±•Š>QïÓqï}£?([°ÆÉ|¨=MŸÍÜªÁnÀ9*»¬kåy¸¯'Şú>õiÃêI%wó!mn@ez¼IV©#å=»>NFÙt0£ùŒ~Föğ«wfãFøÆ4Khâ–i	 ‹1®k;3ºŠˆù7uì>ı“úƒ•îœ>ÎÀ$ápßÕ‹ĞøÊ‡‘Y®·ßùMï^_'ŸWëû*µzIìû»åZ.÷ØfÀ”\>TO¸–·æo?¨ƒäÕÛDÒÜò}…FæA¿jî@HëÆ©œÊ¤^ö#˜§Ór¼¬‚ÖÌœêÒ2±ŒÌ	±Vñ°Ò´I™7%s\¨dÚüÊ÷áàEìkz£í¡§È¾ÈÄ`YsñĞOJêUG».„J×gM×><O^t†‰6lÚ¥<­´sSqõ¸¨–iŠÁ”ød¹¿ ¼ºßJ¤×ukc§‹÷2/§<‡i6/mk;hiFŞŒüÿ ™Ë.?õŞr²È^>ÍÚ9-	¶Â ësÇZÁ,ªz5³­ô<c÷Ş?vÂ_k{Ïµ¿wí3ºÙñıÂ2C*¯šújPƒk×~-•\3Üâöûi×u(û×ÿ 'ìŞç÷[ÿ R?¦}ù}§ıMÇ”ew>ßß¢–?oæä„XßÑÊ#|2(Å:˜›øÕ¼ÕT½UbÚ˜òñò;7MgîÏêGôëß*}ä{ŒßÓßëWgp»¬Ì˜¹„-ÕcÎÆFî€ß!Îƒùr]H´òrBÓUà®«ê¡=ãıŒŞÏş¶Q{gjÈÀ÷®F/¾ lä“¾Êé‰•‰‡°´‰š!‰w3]{€ÚÜX« +ÛOmù¾ØèõjÕŸâ~5îõÛ?¨>ä÷ögÊ½›6r˜°Ü‹(V7
@ ¬‘°Ôk^7Ümjº[áÿ Sè¾Ò©jrVwÿ B^Ô“µ`{‹·öÿ êjNó’q#·acä)ÆÉ²•‘hÉbŸÉ®›Çè^fÔÑOŸô¸ß8§'÷}ÿ ‰÷AıQöùôOvÁÌíQK´#È°I
#j¬Æ&P±ÛõÛnõ\\–ğ|W±ÃGıÎZB0W•ãuˆC++«8‚ÅwÒò“UÁíÇÆ´lÊ‚©à/~“§•9ÕÒú
Y"1­¾TÕ‰u¦ ‹[çDƒCU¸¤ì$€ GÓ­5b±«ÂÃáFBh=5çÇ,…Œ†Ğ4áU$º¤+/ö
$˜ €ÇáO"ÕPZú/Z2%Ô{|.jdx…€ãıôä1‚×¶ÑÖ”¤0¤ñµ¹Z†Å‰- h¼êr+6¶Û‘Ë•TŠoÄrÛÖŒ‰Ä|i»©¶ ßN?ÛFDºÁ ¤‹GO
$uÔau¹¸éI°u$Èv i­¹ÛåK"¢   ›iÀÑ$¦H ?)·ÀZ”–ª@¦‚ãw…´ªÈ–¡êK˜6Ôt¶”¤–,÷â¿$ Tä­ğ¢D=/k\ımó¥%Ö²D¸bÆÜxZ‰”=	Ø(½®´èiHü $cÄ›ëNEeuE€ĞkzYè¦ÄpğöQ",5[[ş/@4-»7½øxŸ‡:$!uÑ¾<8Ş‰Æ¤,~74†«%…@Xí=EáQ‘nVª6ñ¡ mĞ‘W0$‰€q^"¦Cà’Gå{ò[ê>RlªÔÔÜ‚ÒâÚŠ$¦µ%¶÷âAÔZÿ JJDÊ¢Á¬wg
.v~‰RyÃ÷ñ _ğÂ¹Z©µy.–šÿ ¢7Éåår,oD/ÉîÉ•[‰£
p.Àõl RBj©‘›EÈŠ6‚Ö$ñ$ëğ¤è‹\¯äébÂÓ8*M¸¥ghHéãµ­äëÇ„¬6J_ËÂ¸­c¹Rw+“áÇoê].*UŠt9“áQ,n­üÄİX–­“9¯S!UFv±¾Û“n•ÑW&¬4Ù©y"dÆû\é×ûl çm•C”³Ÿä·	Òÿ 
Ûc5®ÅãÔ­¹p¢Jˆ&¹FEf·›nÒÚxÛZ7'(÷n>ï·ÆÂ™æ@Y’8œİGK­.¶KöÑ#ï¼JŞ¦$_o»VØÛ_À’F•½i_'=¹o:(?3ÿ äGô7ú•ıA÷ŠûßÚ}¶.ãvì<œ¼s=\5d.‹)PÊËn{ßJäµUO_ö¾§çÌÏîéº —Ş¸vXå„œüY"_ç¡„Œ6ZüÃW³Æï]_Òæ\\“muşïÜ19yE"4ó¸µì©gn¶¼Zñ]3ë-íğÄèo“¸DóvìüÕİ=4)‹ŸãÎ‰ ß2Hlqùo\ÜÙRØô½qû	Õ-^Ç¬öÏô—³\;|¯8{oú‡ÛĞÍd‹!Ãî¸*UeÅÏVõ `RÇ©Œí`v©—*«ÅêxŸzõ­hä®“£_Tt{?ş-ÿ QÜíŞ}ÏîşÛÚ¢†*ÏÙ’lÜœŒhÔÆYU‚0H%sÏZú*úÕºŒtúŸıÛÑË¼?¡öŸhÿ F¦şÎRØ¾NíÜ]„“wNó9ÉÈi °dXÄqÇÃ‚®k®¢HàäûƒoI>ÛbÆÅ…1q¡‚EQãÇ,B1ÁJ…±QĞéNü3§¹É·ƒ_zÆÆ‡x ;’MƒjZ×]ƒ¥cINídÒg÷üÂ¶3n@5Î¿–‚Hñ×0òG×çJ 	7×Tı#Æšq:‘~”ä;®uécÆ‚^ä‹’Nºëó¥,‰p¦ìÇ^
õùSËÜépmÀõ Lƒ¾ÆÚÀxU´ËU®.*–h¶ Ó`¦û¿Â.>tÒ%²JÛµ‹ò#—Z 7:7ä>:šC@"Ç Òãç@62ç…1¨ãD‰K)±Ô/¥ç†—çH©ÓOP1©$€øPDKb°,tÿ À RÓi·R/LOa‹ 6<ík(bªP"ÌÊÛ”›±"ÿ R¹1ò›¾·Ö øÓ3{ ]mf$›õ'çI«Q‡ nÃq7¢2@­´ÚıI"ôîÄ\†×…ÖÃ_ÙL§RÃ¼h¢ì|mqR˜YRdĞí·ë"÷#ÀƒC´+f$²DÂÜÛ‚é¥R3ü	,’ÍŞ8îğç@&É«³\:ÛMH'mKE' -€ÿ §ˆÀ
RRDšQ¤zÜºŠP<‰¡NÓsm-¦ëxÒ€ÀE›€Ôí_ZŠ7RHm6ÿ 5ïğ­X‡G2\€v!×ƒ*ùGã{Ô6mZi© ¯ky@·ÓåÒ€Ävã±U®u7 €> Ğ&Û Òë:‚ [ß¯TàMø,+"‚nÌlmkn>ªeƒ#»hcn:\7÷S‚dq»K•ÛĞ›õ<i0«b’BH*÷^;U”9ñåBCvdî	»Ö°€ë ¤SÔÌ})7m~”H)ğqıB¼N„±$|/\ijté’Å…‰&ÚiÛW~MĞâ–1¯(©nkIğ^p Äšoåxğ©\…¾%ó™êˆ±Ur[k²›Æ¤r¸µş¶­Ô³’Î«E©ªìRÿ c8?ûŒ6E¸iÃB|-Q~6÷7§2[?İû‚ÿ ®›A:yP(¿.<kÂt/a—†| ­kÜ¢=¬-Ì(:üë(I›Ë²3æ‰qM$Bh.axÇ I¿]+zº³šêÕÖ DÛ</²ûtøê(††¬š‚‰Si±…È–VRAøh~u²f6F,§1ŞøñÎ	ü¶d6YZÑ91zDˆ|³È›¬d†şÄ^ÃÆ®d–¾¤]åKÇŒ×>iò¿ZÚµ0»`“Ë ÈHc¹Œ}N‚×<+XFY4O×l‚7ì—mìÚ—_ò‘K4Ë#n:!Ú,Àóuùñ¬¬Í¨ ìÃäBp²‚daH
I‰‹,X†ÁRê+Ïå¢g¡ÅÊÖ‡ËûWş<ÿ N}‹ıFOê—³»DÑwH7¾'eÆÊ0`ádÌ“ãÃapÈì¾‹>Å¿”rYˆfÖºNRşG;úãı9—úˆŞ^ÓF—Şı£cw>ÄÊ#Ÿ¸`«Ck¸„³líu%oºÕçû<
 ö¾İîáy_Í|Ÿ}­î,¿lw¬/uöç1äöì÷É 1íd>›	¬T0¼ràÖ½x¼Tµ/åşÇÜsòñû9Îÿ İøøÏoÄı]zÅîªÇ·äC7nË¾<‘·¨HwEøE}ÿ «fè§sño¹qªr¼^…±¸6*KtôÅÿ kµ³Ïªƒ£‹›·4r…	¹ìnOÚÈhö½î9„s5ÅË¡ÛÄÎ7}í‰*Mq‹=ìœ‘Æ¥G‡1K—-Í/Ç§v·¾§ÆºL¬€›õëIY’m‚ç–İM"om$EƒXü©µùn½øÆ€j¯ l¨ä‘*VÃZEJ€´†½ƒÇ
'Ş.oku:q¦K`XFK“@6Ôs{ë~JBÄ·æÓ2ZÔÊiµˆâl/D¸X µìlmn´ $E‘…¯ru]	?p&Ó$ŒœHÛÖãöRb¤îê×ÿ Ö‚ eÉ]îı&×?0h€#9Ì'iê-1&É“góµíùE­n¼(ğ8Ô‘gı/b‡]<i	Ùˆ1ahô#‰¶§ëDF¬U¬Ë`x±7Ôr¦fœ2GxÕv^`oğĞŠ“_©à/˜€ÍÄ€H¨É±†K]<å-jZ–’h‡­º±Ry€FŸ+Óƒ9-ÜG$Şö<¾©Õ›V¼8Ñ®£B—ÒYŸ`Pä©bn~WühÄ;	–r¶nN£ş\ê`&D¦·²‹´ä˜}¨úZÔ µo Ä†m prÛ®~¶2bÌw‘f:\ğ¹ü);)]¬I×ˆĞŞ¦Yºª*x±ÿ 9ÔşÊ%ÑÉ+ÜèÓ¡-{šEF„LÚÚ4ü Ûå~Ò!XM"¥• pukÿ u8ÁŞ6,uKíè·ëğøĞˆ³dDÍ…pª§[Xè|vñ¡©[KR"a ª‚—Ûê UˆãaÀñëNgSL’(séÜ_‰¬àİİ@–X]¬4àßÂÆ†™5²Ø·}šÅE—…õ¿ï©‚™ş [7ğÿ ¼~4“)Ñvg0üÀ›Â¬Í¢±—ovì?¥c6ê@&‡Y@¹ æh‰f]Ê	ÔXÂ¸2;]M˜€Õšu·HÁ-~–7gàj¨“÷§Kı¬Õ‰9Ú\[PÀ_oËZÏÙné-|™9=Áƒe“4W%w±à§÷×e8ÒGùf†EË H„P£¬§Ó;K2‚cÀñáV”2ZÈÓ‚t’S´êUYøÜt¥{¸ĞºqÔ¹q° %1Qœ­í,‡`ñ°][çjå›3®ª‹bq™®m’éá¢-¿ô“øÔ:¯&ŠæÈ¥•™ıHÈ± Äƒ¥¯nb°zS6>#öôo·|k’© t-ú­×oÜš0|-Éš’[B—?•Çï¥Z1ºh¨ÈHº­Şà|¹Ú·0e-6òAŠÖıWÒããZÕ¶b›92‚èÂçvï.¾Šè­{SÉ<L“+  
±­~w¸#éNÜ‰W‰¿ƒt8yg%áUPÑ‘{è|ÂãKpÖ“ä•&•â²´—·ä/”€ÇïçÛèÓ†Q¾<yb;$ó©mÊ“äLµÆÑå»¯uŸ-àÆõk…&ŞOò®šU4pòò:¸G'İY1í|˜Y ØòÜ¤¨@&èë¨ñ<+GÁ[#%î^`óİÃÛÓÜXŞõÈì¸Ëî‰ñÀÈËU´S‡
¡ò kÇ$Ê4YwÒ±¯¡YÔêÿ ó7ª…åó´˜³±”eãÁ"¡òF±ÆGùP-«»]Ûrkc³&(E¢xœ-ğ¤ä¤‘)0eŒ†-å"ê×$|k5rİ1]ãpÇ]m¥¯QxhºJd}ÊAí"KX¥BÄ~›ÜkÓqq¨¹İ{~ÃÅÈK0‘U€˜ÛCáÎ½Dyw™Ux«kÃm¸©
G¸(N:éÂÈÕ¶7'•+@nËZÇ•;)$^Ä‹…>RzøRf•†'Tk¬– Ø•$şêd8•IµÍ¬NÓ§‡	hfe_ÌÀ¥ØZ˜ -ıBÍ·@ë%üi¾£ÕI»‡Âü~ƒv†PTjnn/áLoA³°]Ñ­Êê<Ã_
ÛĞ§Õ”æ£ÅÓ¹_ä-UjÒ"—¯ ıEIÛÃ­¯¥<ˆ†On…Èó<×Öş¤¤ãUeĞ;&íùU‡­I•FÆ¤	Kî+#hñÓ¥¨‘´X8Ë30ÄI°?ªu²CŞ6†V95ïÆˆ)Ûà¨H·V-¥­ºÖ¿Æª¤•£¾æµ¹Ş‘Ds­†º})hÀ
M…¸ş4ŠOA^Ä…n î#Jd‘ –¾« çco†¦Ôq—^%X~¢‚ß.&†ZCe·n²Ó´W'öP‰dƒ$JH ±Ô‹×™Ò¥¦ÆÚ@ó–Ú+¹A·ÄšC)D"f ïB‹Ä1$İâvëTĞ“¬Ï§¶Û¨áõ4 2"%ÚåŒy@ÉB¿AN“úË”¸ô’;¨ÛõëF3eËpÔp ÓãùC4DŒ¡<ì÷QÁA<(/&3‘½ÂnüªNÒzZæ–#|š	‚S@[¥†”ÈLªAauŒÈwÚßÎ©ÉÆKòúj,AW³~hcNKv±h8‚OyÔIpN=êÖ.G°Óæ,jd¤‰ÌE”µÿ (êOJ’´3Ëê€"@ªŠn×–ß;Öµƒ+ÊDAv m„7İu:pĞ~TÙ[4úÆ%@rÂçé¥ë&¤éN7äÇ&ã¹óY¿–ÆçÂàr¥ˆÕŠ¤ÌDÕ%’5æçÇB*•EnBÜÀó†•W¸î§Nv¦’uƒ&L’L‘éŞşëâyşÊó$ô­ÈÆåP-È›|µøUÂD«6Å¶1'«+ÄX®
4Ó_$†AÚL1›Ìøûi;‚DÕ{‘
ì§×9_€¨\†Æ¨òŠ³Ù/Õ€¿Î©XPta*Äq
x_Z¦ôZš†*RèÜö?]rİTAib6`~Ñ\ìê©(ä”ä²ëkYÂ4rsráÆÙÕÑd—8»o?ªÂ×ÓÆÎnH9Ş”òºïm—¸3[†áºß*î«<Û¦Z#t€ºuµÉ>&ºU‘„3Ds0²°;yİ|µLøó³“
M¯aÄD_…ekWÉµ‰dvöïaó¸;˜“çÜÇSãz)È¶øÚÔ»?ºÄlè²Æ·
÷Xëj/ÅKNk£TÙ7ÏÄIÚ÷c­­\ËÖs¡Õoe%©äıÇÛ‡}]ªdœjÈÆ7]y:ê/k0ç]üky|Ë±[+Û]×²%8ÑÛqŠA,6¾£Ü |<k¢–Mœwâ²BÄŸÖÍ–f…Ññ x‹Ûd«5üÊAà6ñ­%=jµn6=çeÊ“5SŒ«ËÔ"ÆŞÖ³½qòwqÛ/mKÙ@ÓQ­bÙĞ‘×Æ	4f†än7±±äkšÌêª”dÈÄ8Í`HQÂÜéÖòM©Ñ¬y4R$ŠR]8«hoXr(røÜ¨gÎ²álL©1^ş¬NÈA¹ÑOz‹ô8Ü£ƒ—KA[0)©ùñĞó«2pÑì *l–+¯Öô=ÚjOê(.ê[·»öŠie$÷ùX°ù‹Åé@eUÆ‡[Ûãcã@²)lØ•ö—ÕMŠ€Ç_­VªfùašŞ.Y—áoÀô¨zJ`YÑíæ>Ss@¤«qf`E¾«3&7ærç°¸ùr¥&€fXl$±'€-ıÔ¢A[ÆrqÀÜHPæ7à)âÃ±9°}9‚¹ó ›éF$»¢ØšKnkm,
ñøÒcCºGÁ2X7ãQ	Q‰ePÍÀ½¯&„­$Xí’÷;ce·Mxüª‘6ZÉ ĞÈ»C.ëXvçqqz’å	¦E¶âeäU—d…÷+rØğó^÷¥ˆò-V[…[ 4·Æ“*Q$jÛİÂÛA½¬S­8dæˆyƒz¥p5°bâßĞ„Ü$s‘1×p±õ+}	6§¶‚nuAİë0Q¦ĞÊ·>:i­9Ôš´jÂòn¿êºXiRÊ˜#.De‘X6ëùcGPNİu¦ªC¾º–	c_4ŠÑ³ğ ~DÑ‰y¤J‰É’;è[€?#­K*|–‚Uû^À¢Õ;””"•YK¤s~‹°kü”Òd»Ô„sÈwmBG6W
	FÒ	 Õ4B¹iœşYEĞŞàŞ§û>FL®ŞFŒ°ê—¿Äñ¢Rm–¨¬á_ÇàMC–j’[„Îş]¨]O ‚úÿ ˆò¥QÜÍ÷YÉ7TÚxOÈ­1G?cğ8æ.¤¼‰ãåÜŸ‰¿Ò“B­™¥%79mVüê:&K½ÆÒ®0½7m
Q.©3:ßj£9_%¡Ê¬T¯ <÷<øÔ2å=èI©2©‹Š‹ÃçK"°…¹õÛqYÕ_phü£ãs}|)¶N2Yä*ú“È³²ßqE+õÜt¤Ü—TÒ+—"EOJAaa·‹x§J¥S;ßè(û”BÈÉ.æØªìEønéò¤èÂœ«àÀ";Øï½Ï”m}-\C¾,X¦6±
8p ›õ44LĞ½¼8?Ëu¹ëğ½&ô4Uú>Ë óÈ$é “fÔ¢'şÉ
¸ub¤jö6'æ8T¦]ª#·Â rE·6ºtµ7h¤–Ã")ÂÀ"èÒ7;rKğøÒwe.5øÛÔõò¹:Öv±u¬ºÅc)DøÍ¿¾³zšìqóåIÛÎÌ…ĞLä…úIJ…FhîDËßÑÉ"¢x»Ø¹'™7ÕDÚÍˆMß—cˆÓç[¤bçÉ¾,¬¤]Â/ÅMÇíÒ´D=)Œ7¼e]lw5ÇÊ«8BU–mÊÄ›¸vÉ·…låÚñ>¬§q@t±<+–Ú³¥J¬y91g÷<¶rD¸ñÂIô¶¥Ù—b	ù
ìãâIwåmwÈŸ40Fdy( ‹‚y•66§Zë¨¯xZ™“n@Å™ñÉb İFñÈtk¶¶PpÙ9†t±ı-.ÆİIº³v4Tgc#	,§zÛò5˜xxXr3£_ºvNÙßgÊHúÉh”~o*^ÃR|<+N¶~n:«6^ÊÜF×ıK¨·î­õ2”<¬çrh¤ŞçŸÆ¦ÈÖ¯S±ŒNàÁŠß[×ÎÊ£xlú4aÄävix¦r«‹1®	×¡ªÎL±†qıÕÛ×3÷8Ë$øªÁX®øomÆÜJ_é]<°àçö8rY|+c)°çsco
õ‘ä:´Ê¾åãäIH:)7ÀZ­U3r4YSIåÈ«É¤Gï¤è‡^VÀ¼ 7¨·ü(U?rèÁ–÷I}3e_…k2è‰U;È½ôP9uÖ³±µv¦6¸rT( Ø~… àÈM¡Í”ñ }t¢52·s³'ÑSùTã£_Çs7•RIÛ~CDf@»d“{s%B“òÂ¥šU0rîlÆÄè-ÄŠDY¹&Ìñ€w¾A |MÍ;AIšòUfq`XŸ¸ĞÉßRö`bX©$·ğ¨–m¡!±U#qş;Úß*j¤äˆï×ÌnO[ğµTÙ‚ä"›IeÚ3©» )4¼’3D£xæ@°¿†„‹µ€:m ) \Ëe±å¦¤ĞÅ’òEfÂŠÍ¹éÜ@ãáNuE™¶™QÉ·Äüé*1ö¡F@Q¥Ğ›MúØ’8ĞĞdš"dˆ.İ²%ù¨;‡ÌM#7d„É¨ú¥Wò¾ç|È±4l7û‰‘Ïıf÷ğ¸¥%ºø,’¬H[Øæ7úƒU	@„È€Ë´jËkz“jfnÈƒK.Ñ"Ä²|¢;oñš&Ê
À‘ƒL1È	Ú}X÷œ«I[CŞ=ee;Ğ«ğ>™[ıO:†‹Êw$¨ëaëÊäê=BÔ¨2=W’Lg¶ämª98 ëÒ×6 išL¥7Ø²/S!_À©ªPÉm–4’¬{ß `@ÿ Ô´£SEı²T™’£lDU7;€mà 4å¥<S3¯%‘¥=YMŒ£cµ…ƒ_­í¨¬œ#z¶Ùc³©
}G<Êñ€Ämj”Íœ¡-ØîcÃôX§•F£….Ym{X†ãÈƒCR4ÒÜ±½<›%?ÄEÏÔVpÑ¶Ue?eˆ#+$!TJîQ~ Ü^«&,k•}¶+OlÑ êì¨oÌúŞ¯&`éR£Y>õ×w×&çÿ I'ñ«—ğF5ùıIIK–Î•¶13è/×ááRÿ 'ÔÑĞ°Ú¹©(ÂëÃ¡$›üªYµn¾K&Æ*±™ö®¤ï<:8Ô£k$Öå;¬¡àŒ;&–Û€ñi<üd3Z5! üÃs>"Ô‡!´³Jµ«ÏƒÒLÙ
<üÓ:—c¡TÙ EÓyºŸ6µ“6ªHÖ„9µõ¶„ézÁÉĞ ƒ›Xî½É¶¿:p&S#K,fzyæÖß¾ºó?J†µ-=
½)¶¢0‡A{ ?"Lxã‰ŠÏ5Ë:²B£[Zö¹Òõœê[M#9*vù@R47¾ŸZé¤ö“¥–-å1õ«h”É²·Y<‚öÌ/ûªuˆ m:K´5øÛ€ê­S3¼) ZC©érÂõ©‰1àbKÀñòÛÂÖ¡ÒF¯\É0ì!%±²¢Œ•UbU”ğ8Úü7¢¼.IäåOè.İ†eDû§³0@oòX^µ´­Œ¨§qÛŞ—!&™}q+bQeŒ¶í¨Hûé;,C–§#?#.õÑîÜ'¹6¹
è¤t¸|RÒ9ùšWpv±æYaV$—·™ˆøÕbÓ)^jkÄîRãÊªr.¤ >´íIA^Hg;7¹§w‘2¤OEŠ€3{ª’÷SããÀÆüİRØpÕ”zs·ôR¿Qj·x§Ôß.DBåã‘tÔ)</Rî™uã{ŒL¬«&œ¯{ŠÂú›ÑêvNêw!áoÛ\6©ßW¡“:6ÙuÖüGöt©L“2)¼S±Fö°±^dUj!Ÿ<îÒvÜ¹qdµâbTğßü¯¯Qø×±Åudx\µu³31ÍÔ²·ñN¶M˜ÚÂZÆÃpÔ“å¿Ö¤EJı/ê™C‚,ÕúƒV™ŒC’[^ãpn‡×Z`4Y¿9{¥üª)2ªÙ%V´¼Ÿ*—[kÏU©l¸Ÿ#PÕo)&×øZŒVš0¾fY‡•Y£¢ò¦™-@®VÖ“jñó5ô4àœàĞ¬…H“E·æbëÌÍ¦tVÉ¢ÏŠÛÆÊ%^
:\^ŒY9×bD™àà8fâ,~vªDÚ	oB’†áÔó¨†S²1Ï†İÅ‡ù}T™ÀÌŠÇk!Fm ŸZ±³]Mô¿Ê©!6V ‡›x5ÏàF´ nÓ¹›}ªC\¨M£ãr ¿Â©PÍò$àš>4‹½•Xq_–¢¥Ê4®/r9rÑÅÃ}(ryòÒŒ˜:Öt'èÀ¬ÄQ "Àj8[¥1b…4S±A‹’ğÕöÇ›¯Ô7•	ü‰×]ÆTQêä;“ ´Bçä´“Ô¦š![Ëp……¯æeMÆÜ”M[D+9}°â<âh÷iÕÜ*q+µ·ŒÓ«ï/MnêÚu°ñ^›OR»`Æ“ "ñbUØœöQÖÅnuäÊşãíòæÆûAe˜ıİ>¦gşM^Æ…îØ.‚Dš6˜† ÈÜj]l¾ê–&BäùH]$:ƒÓAøÒu«äX$ˆ>ÅW?Ã*›ÛÀ›Ôš&Fv’(Ë,œï)k€xğ#Ju‚o)hR³wNVYTõ[Ei1ÊèÛëH‘ú“E-À¹)!mü@XºËĞè\šj1•İîÌ¸]XqçkXûQb»±ºº¸às·Ró¥ˆÕäNÈ«{uò­îO¡UÙ¨!^8ÕÅXò¶–ªˆ!Å·*L,x®±Çzq†;.OZrÙ)U-¡Â‰Ác#Üñº•oÄÔÚĞiÇIòI±B­•¤+¡UP6¡Ö…qÛ€¥¡
êÒ@Î[Œ«ö/aqõªÈË­ÈÛ}·³t
Ş‹Ô
k‰’†í³zƒÖš@AŸ¸ÿ ¥UØ ›N¯õ4&<2b­ ?˜:–ø›mı•“±Ğ¸ÛE‰ùD¼Îåü©Je*º²sweÇ;HÍôãS»^Æ•+J¿<#;ÊÑ“³øÚçá\gfÄ£õäv’V!›‰âmãËåVª…“5ÂdútÜKª7¥Û:®şN´<N+7Tl›4¤@ó7ĞÂ±uFÊÌ˜ÇÜ.np½ÁáPêZ¹=’©³É¸˜¬­SZØÃ‘Í˜rİÀ$…AªíUà<Efª‰Ôæäâ><¬Ñ+,û›k;IÒÄëjº˜Ü£i±›Ò—s%˜}4®ÊÃ8,YÑL¾aÁ@ƒW ›eª¶µœq¹ü)Â’ÄÜ_i7¾ ßê)@Ó.õ@!tÓOÌ	·Â×¤¤nOvŠy3¡ÈÇ
R8Ê"±)f‚Æö#K-]|v…©ÉËVÜ£¥ÛZxóÂÊ‡ó0` R»Lº&·;°ÏŒÑ“ê,d/ğé\–“tÑÃ‡µ™"õ²‹6\äË‘#ÛqsÄ4åo…u+ªìru»nf‘¢AéÇæÿ ­£èMi[I¬×Es†-©b9 5½¸VÏcš\œ.Úr21qä•Ø# e4gÒ×Òİi·ÊªRg¢ÃÙƒI°µ­¿tzxßsZÇw‚ì¼L[ªŞàxÜW-®µFf³ÙÉ‰Ïå ÿ •†‡ëBbkÉ×ÀË–#´¡¾èÍ¤—[ÁÓcëCä?ì5ÎêtUèsdR²ù†ÓOÁ-êgî]¢íéIdAûyÏècÉº©æ>téÈèÂüK‘C>oš_y`Ê”‘1Epw+¯ZúUìñ¼‘áò%G¡)†’+!ı[|TğúVÏCI¶Èm¼>Vµ$¤Å²¡‘)$ÇŠÁt»—@@:i­Íh’'_‚âJ¥ï%æ ü45&bH¯»A ¶¬½t¤Ø*34‡Ë‰g‘ˆüé¸¨¹¯Î¨Éë¸Eº˜³&²]–5u?ôê·?3ChJ¯ÃÛÖy2”?˜«2Ù>>UJÆOÏ“J*m¹œ•ş««‚8ğcaPÙ­SEçíö©b…ßòI¢1®@½g,Ú§²YÖè¾£	Í:É6j
Í‰Õ
m¦Â7mébMhbõf+‹3ˆ'€øÖGJ#$XämŒ ±÷·tÓbp‚Ä†Ø VpÌ›ÓaU,±“|L…®Â”^›j&m(ĞÌc’;ï2Ë¹ì‹_Â¶NNGXes÷ã”Br&7¸%ÉúaMVI|‘¤’I]}OU^;Ø³<„ß¦¶¤ĞëgòJI$*Ah	kY5qÖÇöR‚İÙ|O,ŠlI„–7úkPáU¶¤´K(@ªK1ÒídçÌ
œG™T¯’	+Ë¯’æöÉ¹pCm‰¤íxƒ[ó¥íÇàhi®ÄÊˆK4F&<ñ§Ïwï¡!ÙrÃî‰df“ô„u-òókUd¶'‘:­ÁoRöş[kô!­z›j]Fõì‰^+~eŞu'p¥ª)ºÛp•Xd˜»GÈÚàÒrÇVò2^¦!aÃhˆµÉèWAJµ¿.;}×pWòÁ [¶İÆç††÷¦Ç¶ÒZ%•b?s°áÖ$[†áPëğl¹4Õ§Ÿ"eû¬bÒŸË½eµ¯¥Â9Qñ«I¤agFõFÄÄÅuuDÙE·ÚÛmşk}j2fÊ•ƒ]¯ÉÇ ast ñÜïÖ´vhçê­¶4¶«µc€3l¨µ¹ŞàÔ«¢ß2äÂBˆ/à³ mğÚ?m5dÅ‘‹*u3IQòˆr†öFëoZhÊÊÛëù•ÄùH@‚<˜à0™uÿ ­ÛöÓı¤MÖÒl’~ãĞfÙ'f]G[‘¹jq©³åäG;&u’Év+ÃÌªFáÅHÒµ¯[óóxh©{¯}ÄD‹¸d„Œj¤´ÊF•]T{ÿ •ÍU«ş…ØşğXÁ3C+bcÉ%>%I:|*mê§±¥>âÖÿ Ô?ÿ £ö8CCW…ƒ9É‰—ã¸?mfı'àë¯İiÿ ĞœÔ?kÌÊ°çÇ®ªÃsßş«XÒ~¥ _şO½Î¼~åì•Û”„å`Wµ`ı{£uïqXÚ±‹°`4<‡*áƒ×™.ö Ø7à4øÒÊ­26¤Xp¦ç™]ïª(-õ#Jæä½™İÇJ%©¾¬4c´½Š…ük™«9WÁª,Ğß–k`nö
–™­l‹Iİ¹"¹èîµêbÅJ#êÔ¯›ÀéøĞæPÙDdà.Çô±ƒ³GUh™”Ç qbğ¸°¾5­n˜­Fˆ”„¶ŸËblmÔ|kUcĞ®\5&ì©"¡°Üïjè¥“9/G&vÄP6 ²Şà£kàn+C"bÌùY[ â]nmò.ÃÁÆæp"Ïîl¾Ü@Qb-zµrUË4Ùè¬$‚K©•2-­{.«¯ ÕIù"ßm‡&#’P²7æD±ÚıWàO!Æ‹r!×›},¯&^±²íÂG~FŠİ¸ÍØÒË7ø¡ğé¥èäh(œš3·nŒ1>]1úîéX«Ù|œŒş÷Ø°¥ôZA¹"–ú%Oæ×«W»ØÉª-ÎggÀíØØ$²e(’±±eŞÅw[ÀŠîzêÎşÄ’ğv¸dş²9nÔ[àk'ZÙ2hØí®ğ^ÿ ê+lk-û+'Dk‘¦3+\Œ¡' d.:• š`—füš•¦E¼±©RÔ¬>ŒT‚Lìa»mÑ®3p~u…™½Q)˜)`x`ó©ZƒBUpH#…ecJ3Ç{ß·Í(‡¹b½¦vLIQ®ƒk©
Ÿ•z^ãCÍ÷èßî_å ìÂåB‰Øtg@<øšõ-dy5ã²òiNÏÜ¢[.D9'…ÿ Ò'^@Y»#EÇoÄåäÅ‘ŞhŸõ H®ó¸ XšÖ•kÁÍÈšz™d/x£Ë$Ê“º< 6$øUâcÙâI¡îè…¯;.„W^§~—øR„ZµÑ\yÅ$
İ½ãˆs"9ç˜%UGÖˆ_"ì´ìj)D„]½eÑ´,u	“©jşÄÊ\Ddşm…ØMïQ&¼––Šûb,Õ$Ğ6©†^„Ë‹ Àî>U;T[éÀR†'S#ÛBIØ¶øM4ÉµJ%Ä$†BÁÁü×Qoş’mV¬bèW8Ëlh Ói‰İ_ÇÌ4jnì™[eÃ›%-µÂÛ!#,ÜÍ¤"æŒEÚÖÿ Ô³c´D,ùL¤Ü:5F*Z©kÉd™q§Ğ X¢íñ×RhUL—{¢“•,A[ ú—·™UcbøCßJ¨Dge¹8ó§ŸrÆìˆš¾çhì?Êt¢y…÷‰—
>>j<NlªM¸ƒ©ÜI?JP[´­Ëˆ2I#'+ÍÏ€ÒhU·É8§F&8²Uæ<Ó x*Z5Vød$¤ŸÓft+cå@	=ŠT’j–ˆ†¥Á ¡ˆUAkÁ­á·C¡ñ5æÀ,D(OVe$ù}Úu6áğ¡Ége,]‡å½íõ~¢©2-_©œb<¡¯‘xÕt)\rü±ÕdeÕ>K›Ú%HŒqvŸL1ê:
JÆ–£jcvÙqÚğ—7»¤
ª	×ˆkŸéŠœ-yùñŸM¦fuk¤¢8£]F ÿ ü4hÈyÕ“ıÔÈâ´ÀŞÏxX(èlšk»ñ$m*±İ†„cx·±cĞ+Ø•T ÊËÇè6¡şf?ln’°…ORNÆ…N3ä®Æ¶E§º8´íùÖÙ"‘5ä¬¬¿ˆ©Ãê[æú2ï½y^Í‹+¸ü¨Ûw[ëGXwı
¹ãc³9Ä{U¬ŠÚó[øU[´E}„ÅŸîñßÕ‹¶æ(ó’3añsõ¬ú¾¦ïÚò“6Cİq$[ä©Yl¬E¸şczÍñ4k_f­ˆ#0`º±'SÌZÕ8ZM•è¾İ"yÄ;-bÛB§â©a`íãc…—
£Â4Û0[xleÒ²¸ì´(NÕÛâ”4†9Xİò|o¹­W Ïª’j|\pª’Ë/¦uüæÄz­gz¨W/kí2J26¯¬A«,fO†â—¦¹®M½n6Gı·	‰@çp

\ÏQWßbW«MŒ¿ìèÒº†›Óµ×o¢@ëuÛsZÎgé)ÿ Áöş3YDÁåà}\XÚß»-Kü–àWøG]ZbÖ$Fo <My9£èUšaÇ/bdf½À íáÒÕ›ºGU8œğÿ 1”}7“ğ¬Ÿ!½x€åãBûER– »›ò·ï¡Y²l’?¨Ö#zhu"üÛû*±‘+A¦<y	Ü?ˆ]\|$Vm4o£5És­Äp¹GZ—hk$+¯é{ê é®•Ïf™ÓYFgŠP¯$,c°š ²ƒÂüÇ…sÁÔ…*)$³ÛÓ#UnMàjÓ‚l¤~šl3A©vÇÆº+c–õø2–‘®ñ‚Êº …$tçó®ºİoŒ“­¡1âG-ú¬Á¹Xs¥tš“ˆ9¹kÜfÏ1B¨Š.K%€õéğããYÒ¿#ä³cÇÏŒÿ !Õ,o¸ØÛÀu5M…V„ãÄËU+êù	¹PJÙºó¹¬İdÒº¡Çn¿s¨¶äe½¹éãó¦ªĞ²OÉ¢yó›ÒÈbANÂ-ÊçMj°lNélpÛ·wl™\äÍé	é¹{wm½mN899±‘ı½Ûpóãy1…\m»”‰wMÉ@ş!Æº¨Î^J*³¬!Y¦ö
zh¶êÖÖpB«±í‘ˆö)‘oÇÓ$ßãzçgB®…é…zÄ${ÅÀ“´ª|âG€  ¢~Vÿ K›š}‰qO“¥Êw ©ª”C”ÍØ™® Vÿ gdh›GYLyq˜ØÜ¼møÖ1ÉÉ8WÒ´,KÒÜŸ?&¥ÑÁÀ÷K,=½\›Ê‹spû…ÿ Ó×´XÇÚ_·ùie‡ó—	}nl?i¯W3ËÄœ2cJJ¤Šå‹-ä?€µKlª¤wq1q2!ûl¢’ÀÃÍÀ^à¢¹/k'¡ÙJRÊÇ…÷WhNÏÜ~ßrÉ«ëaO¢Íè“k¶¬§ÊÖøó¯G×åw®§‰îp®;i±Ä‹"ië6#¬MfDyZanMå ›t®œNÏª.ûé64DÛOWÈ<IüÜ>`RæĞŒ2O;¬â%ÛkGR5âv”İøÒzhU\êhkúl²9ó/hÇOÓj”hõÜ¦!!şŞ$‘SBav•®|K[Z{´Z"Ì)8':6/¨uğ±$Zc¡ËØçÉ½28ß$ÁÍì²è ›m¿‡SZÚ~M.ò¢-„€^ë·q×øvñ¨U*íÆ†s,ê[Õ‰Âèn‚ÀßÀ›ÖŒ]¬¥?sê(Ÿ¶JeE,Ø¨àÀ«›|)ÇÔ]‹ãô5Cå’/MÙ<ª¾5¨Íxù’ÜuHl¤Ê±•`åe¹¡T-Ê›Ğ‘É‰£yÂÀ†»Å¯ÕÔZŒXß%cQ¬‘m&¢;G0¬¶ñpºĞÓzÆ†tÇÁ˜ÿ Übâ;&»Äq6Şz].*¥‘)½‘z¶$:FŞ’pRênzkoÂ§Ræ¦gîq›2r¦ÃÒ·©qü         }
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
