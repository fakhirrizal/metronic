(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, (global.FormValidation = global.FormValidation || {}, global.FormValidation.locales = global.FormValidation.locales || {}, global.FormValidation.locales.nl_BE = factory()));
}(this, (function () { 'use strict';

    /**
     * Belgium (Dutch) language package
     * Translated by @dokterpasta. Improved by @jdt
     */

    var nl_BE = {
        base64: {
            default: 'Geef een geldige base 64 geëncodeerde tekst in',
        },
        between: {
            default: 'Geef een waarde in van %s tot en met %s',
            notInclusive: 'Geef een waarde in van %s tot %s',
        },
        bic: {
            default: 'Geef een geldig BIC-nummer in',
        },
        callback: {
            default: 'Geef een geldige waarde in',
        },
        choice: {
            between: 'Kies tussen de %s en %s opties',
            default: 'Geef een geldige waarde in',
            less: 'Kies minimaal %s opties',
            more: 'Kies maximaal %s opties',
        },
        color: {
            default: 'Geef een geldige kleurcode in',
        },
        creditCard: {
            default: 'Geef een geldig kredietkaartnummer in',
        },
        cusip: {
            default: 'Geef een geldig CUSIP-nummer in',
        },
        date: {
            default: 'Geef een geldige datum in',
            max: 'Geef een datum in die voor %s ligt',
            min: 'Geef een datum in die na %s ligt',
            range: 'Geef een datum in die tussen %s en %s ligt',
        },
        different: {
            default: 'Geef een andere waarde in',
        },
        digits: {
            default: 'Geef alleen cijfers in',
        },
        ean: {
            default: 'Geef een geldig EAN-nummer in',
        },
        ein: {
            default: 'Geef een geldig EIN-nummer in',
        },
        emailAddress: {
            default: 'Geef een geldig emailadres op',
        },
        file: {
            default: 'Kies een geldig bestand',
        },
        greaterThan: {
            default: 'Geef een waarde in die gelijk is aan of groter is dan %s',
            notInclusive: 'Geef een waarde in die groter is dan %s',
        },
        grid: {
            default: 'Geef een geldig GRID-nummer in',
        },
        hex: {
            default: 'Geef een geldig hexadecimaal nummer in',
        },
        iban: {
            countries: {
                AD: 'Andorra',
                AE: 'Verenigde Arabische Emiraten',
                AL: 'Albania',
                AO: 'Angola',
                AT: 'Oostenrijk',
                AZ: 'Azerbeidzjan',
                BA: 'Bosnië en Herzegovina',
                BE: 'België',
                BF: 'Burkina Faso',
                BG: 'Bulgarije"',
                BH: 'Bahrein',
                BI: 'Burundi',
                BJ: 'Benin',
                BR: 'Brazilië',
                CH: 'Zwitserland',
                CI: 'Ivoorkust',
                CM: 'Kameroen',
                CR: 'Costa Rica',
                CV: 'Cape Verde',
                CY: 'Cyprus',
                CZ: 'Tsjechische',
                DE: 'Duitsland',
                DK: 'Denemarken',
                DO: 'Dominicaanse Republiek',
                DZ: 'Algerije',
                EE: 'Estland',
                ES: 'Spanje',
                FI: 'Finland',
                FO: 'Faeröer',
                FR: 'Frankrijk',
                GB: 'Verenigd Koninkrijk',
                GE: 'Georgia',
                GI: 'Gibraltar',
                GL: 'Groenland',
                GR: 'Griekenland',
                GT: 'Guatemala',
                HR: 'Kroatië',
                HU: 'Hongarije',
                IE: 'Ierland',
                IL: 'Israël',
                IR: 'Iran',
                IS: 'IJsland',
                IT: 'Italië',
                JO: 'Jordan',
                KW: 'Koeweit',
                KZ: 'Kazachstan',
                LB: 'Libanon',
                LI: 'Liechtenstein',
                LT: 'Litouwen',
                LU: 'Luxemburg',
                LV: 'Letland',
                MC: 'Monaco',
                MD: 'Moldavië',
                ME: 'Montenegro',
                MG: 'Madagascar',
                MK: 'Macedonië',
                ML: 'Mali',
                MR: 'Mauretanië',
                MT: 'Malta',
                MU: 'Mauritius',
                MZ: 'Mozambique',
                NL: 'Nederland',
                NO: 'Noorwegen',
                PK: 'Pakistan',
                PL: 'Polen',
                PS: 'Palestijnse',
                PT: 'Portugal',
                QA: 'Qatar',
                RO: 'Roemenië',
                RS: 'Servië',
                SA: 'Saudi-Arabië',
                SE: 'Zweden',
                SI: 'Slovenië',
                SK: 'Slowakije',
                SM: 'San Marino',
                SN: 'Senegal',
                TL: 'Oost-Timor',
                TN: 'Tunesië',
                TR: 'Turkije',
                VG: 'Britse Maagdeneilanden',
                XK: 'Republiek Kosovo',
            },
            country: 'Geef een geldig IBAN-nummer in uit %s',
            default: 'Geef een geldig IBAN-nummer in',
        },
        id: {
            countries: {
                BA: 'Bosnië en Herzegovina',
                BG: 'Bulgarije',
                BR: 'Brazilië',
                CH: 'Zwitserland',
                CL: 'Chili',
                CN: 'China',
                CZ: 'Tsjechische',
                DK: 'Denemarken',
                EE: 'Estland',
                ES: 'Spanje',
                FI: 'Finland',
                HR: 'Kroatië',
                IE: 'Ierland',
                IS: 'IJsland',
                LT: 'Litouwen',
                LV: 'Letland',
                ME: 'Montenegro',
                MK: 'Macedonië',
                NL: 'Nederland',
                PL: 'Polen',
                RO: 'Roemenië',
                RS: 'Servië',
                SE: 'Zweden',
                SI: 'Slovenië',
                SK: 'Slowakije',
                SM: 'San Marino',
                TH: 'Thailand',
                TR: 'Turkije',
                ZA: 'Zuid-Afrika',
            },
            country: 'Geef een geldig identificatienummer in uit %s',
            default: 'Geef een geldig identificatienummer in',
        },
        identical: {
            default: 'Geef dezelfde waarde in',
        },
        imei: {
            default: 'Geef een geldig IMEI-nummer in',
        },
        imo: {
            default: 'Geef een geldig IMO-nummer in',
        },
        integer: {
            default: 'Geef een geldig nummer in',
        },
        ip: {
            default: 'Geef een geldig IP-adres in',
            ipv4: 'Geef een geldig IPv4-adres in',
            ipv6: 'Geef een geldig IPv6-adres in',
        },
        isbn: {
            default: 'Geef een geldig ISBN-nummer in',
        },
        isin: {
            default: 'Geef een geldig ISIN-nummer in',
        },
        ismn: {
            default: 'Geef een geldig ISMN-nummer in',
        },
        issn: {
            default: 'Geef een geldig ISSN-nummer in',
        },
        lessThan: {
            default: 'Geef een waarde in die gelijk is aan of kleiner is dan %s',
            notInclusive: 'Geef een waarde in die kleiner is dan %s',
        },
        mac: {
            default: 'Geef een geldig MAC-adres in',
        },
        meid: {
            default: 'Geef een geldig MEID-nummer in',
        },
        notEmpty: {
            default: 'Geef een waarde in',
        },
        numeric: {
            default: 'Geef een geldig kommagetal in',
        },
        phone: {
            countries: {120.68,596.87L121.26,596.96L122.49,594.35L123.85,594.02L123.33,593.08L125.12,592.46L128.96,597.31L128.96,597.31L129.08,598.54L128,598.77L127.53,599.45L127.99,599.96L127.05,600.9L128.77,601.75L129.69,603.15L127.22,604.66L127.15,605.15L128.54,605.45L127.52,605.46L127.96,605.92L127.4,606.68L129.35,607.81L130.7,609.64L130.87,611.55L132.15,612.99L134.03,612.53L134.32,613.61L133.25,614.26L133.23,615.02L133.88,615.64L133.98,617.07L132.72,617.78L133.33,618.09L132.97,619.04L133.95,620.45L133.95,620.45L132.3,620.65L131.79,619.3L129.79,618.1L128.62,618.71L128.14,620.39L126.04,620.26L125.15,620.78L125.4,623.48L123.22,622.86L121.18,624.45L118.42,625.23L118.03,626.23L115.7,625.59L115,624.34L113.76,625.13L113.23,624.78L113.14,625.75L113.86,625.7L113.77,627.36L112.41,627.77L112.6,629.5L111.25,631.17L111.25,631.17L108.82,630.98L108.27,631.76L106.07,630.46L105.59,631.19L104.99,629.88L102.47,629.84L101.98,630.5L102.53,630.9L102.22,631.88L101.18,631.07L101.21,632.23L100.18,632.9L100.24,633.59L97.92,634.36L97.44,635.36L96.27,634.83L95.87,635.52L94.06,635L92.95,635.43L93.36,634.65L92.84,634.4L92.57,635.25L91.79,634.61L90.01,635.22L89.56,634.89L90.21,634.55L89.49,634.51L89.3,633.8L88.02,634.03L87.95,634.8L84.72,633.44L84.72,633.44L84.28,630.53L85.31,629.5L84.84,628.21L85.37,627.7L84.87,627.26L85.46,626.53L83.84,626.18L83.17,625.7L83.24,624.64L81.74,624.28L81.95,622.33L80.23,621.05L81.53,618.07L81.53,618.07L83.21,618.84L83.66,618.35L86.14,618.75L87.28,616.52L88.44,616.19L89.03,616.78L89.17,615.81L90.85,615.35L90.94,614.29L93.74,613.44L94.75,611.75L95.91,611.5L96.45,612L97.35,611.38L98.1,612.28L97.77,610.7L98.56,610.01L98.33,608.48L100.35,607.94L100.02,607.25L101.21,604.78L100.08,603.84L101.26,602.25L102.58,602.46L103.74,601.19L108.27,603.22L109.05,600.88L110.8,601.64L111.83,601.15L112.81,599.93L112.78,598.95L114.51,598.08L117.15,598.57L117.33,597.7L117.97,597.96z"/>
		<path id="RU-TYU" title="Tyumen'" class="land" d="M332.24,596.26L332.7,595.82L334.61,596.18L338.35,595L338.3,591.88L339.81,590.63L340.77,591.45L344.13,589.63L345.08,588.1L349.79,586.83L351.14,582.66L353.01,582.67L356.81,579.57L355.68,577.7L357.92,576.81L358.92,577.28L358.96,578.25L362.09,577.13L365.31,578.96L367.45,578.38L368.13,579.14L369.63,578.43L374.54,582.8L376.01,582.98L378.58,586.1L378.71,587.57L380.12,588.9L381.37,588.16L382.33,588.46L381.88,589.85L383.31,591.18L382.35,592.29L383.29,592.73L385.05,593.24L387.5,592.46L388.39,593.26L389.39,593L390.69,594.4L397,594.49L397.96,595.13L397.96,595.13L398.09,596.2L398.09,596.2L396.55,597.65L396.33,598.63L395.04,599.05L390.85,602.44L383.66,602.16L382.32,603.56L382.59,603.88L381.35,604.53L376.66,604.1L375.41,602.83L370.43,603.66L369.98,601.09L370.34,599.01L367.35,596.89L365.02,603.41L364.67,606.72L366.33,610.46L364.11,612.76L365.82,614.61L366.75,614.56L367.27,612.96L368.61,613.04L369.31,615.04L372.18,618.24L372.7,620.13L372.29,621.33L370.94,622.3L368.75,621.84L369.24,623.74L366.98,625.08L368.38,626.66L366.74,627.53L367.69,629.45L367.15,631.47L364.98,632.3L367.13,632.74L365.28,633.74L365.69,635.33L366.63,635.83L366.18,636.95L365.11,637.24L364.56,638.24L364.83,639.45L364.83,639.45L362.17,641.22L358.71,638.6L355.34,638.7L353.56,637.48L353.35,638.41L353.96,639.22L352.24,638.4L351.46,639.65L351.46,639.65L351.41,638.21L348.25,635.11L347.88,633.66L345.85,634.17L345.1,633.32L343.9,633.72L342.4,633.36L341.39,630.62L339.74,630.59L339.31,629.87L337.83,630.28L337.27,629.32L335.84,630.5L334.25,628.82L332.41,629.65L329.78,626.2L326.27,625.77L325.21,622.87L325.01,619.96L325.01,619.96L326.73,619.66L327.23,618.19L325.9,617.68L324.35,610.86L325.32,609.21L324.46,608.19L328.19,606.11L329.11,606.77L333.87,603.12L332.68,600.3z"/>
		<path id="RU-UD" title="Udmurt" class="land" d="M227.91,628.39L228.43,627.66L227.71,627.12L228.41,626.3L225.95,623.69L225.99,622.22L226.24,621.53L227.46,621.58L228.66,619.08L225.66,613.41L226.4,611.62L229.24,611.1L231.08,608.56L231.66,604L229.65,601.62L230.56,599.27L232.74,597.55L238.06,598.51L238.57,597.11L240.01,596.58L240.85,598.21L244.75,597.31L244.75,597.31L245.56,599.41L245.05,600.59L247.21,604.12L247.74,606.27L246.81,609.38L248.37,611.24L247.58,612.72L248.54,613L248.56,615.26L249.48,616.18L247.82,617.31L246.83,619.43L245.39,619.61L245.27,620.37L245.96,622.35L246.08,621.6L247.21,621.42L247.03,622.17L248.84,623.84L249.25,625.48L249.25,625.48L249.25,625.48L249.25,625.48L249.14,626.33L247.8,627.04L247.09,628.55L244.91,630.52L244.91,630.52L241.95,631.86L241.05,631.04L243.22,628.39L243.27,626.97L241.63,626.35L241.51,628.5L239.4,627.17L239.66,622.91L238.61,623.71L238.34,625.15L236.11,626.5L238.3,628.02L238.12,628.53L237.07,628.37L237.55,629.6L237.03,630.02L236.48,629.2L235.49,629.84L234.64,628.82L233.7,629.3L233.52,631.53L231.84,630.62L228.59,63