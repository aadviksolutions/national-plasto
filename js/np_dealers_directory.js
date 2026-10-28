/**
 * National Plasto — Verified Authorized Dealer & Distributor Directory Controller
 * Provides interactive search, state filtering, pagination, and map synchronisation
 * for 470+ verified trade partners across 17 states in India.
 */
(function () {
    'use strict';

    var dealers = window.npDealerNetwork || [];
    var currentState = 'ALL';
    var currentQuery = '';
    var pageSize = 12;
    var currentPage = 1;
    var filteredList = [];

    function sanitizeName(name) {
        if (!name) return '';
        return String(name).replace(/\s*\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    // Map location keys to State names for synchronization with map pins
    var locKeyToState = {
        'wb': 'West Bengal',
        'howrah': 'West Bengal',
        'kolkata': 'West Bengal',
        'bihar': 'Bihar',
        'hajipur': 'Bihar',
        'east-up': 'Uttar Pradesh',
        'west-up': 'Uttar Pradesh',
        'lucknow': 'Uttar Pradesh',
        'jharkhand': 'Jharkhand',
        'haryana': 'Haryana',
        'punjab': 'Punjab',
        'rajasthan': 'Rajasthan',
        'jaipur': 'Rajasthan',
        'maharshtra': 'Maharashtra',
        'nasik': 'Maharashtra',
        'odhisa': 'Odisha',
        'cuttack': 'Odisha',
        'uttarakhand': 'Uttarakhand',
        'roorkee': 'Uttarakhand',
        'himachal-pradesh': 'Himachal Pradesh',
        'delhi': 'Delhi',
        'jammu': 'Jammu & Kashmir',
        'madhya-pradesh': 'Madhya Pradesh',
        'chattisgarh': 'Chhattisgarh',
        'gujarat': 'Gujarat'
    };

    window.locKeyToState = locKeyToState;

    function getDealersForState(stateName) {
        if (!stateName) return [];
        return dealers.filter(function (d) {
            return d.state.toLowerCase() === stateName.toLowerCase();
        });
    }
    window.getDealersForState = getDealersForState;

    function applyFilters() {
        var q = currentQuery.trim().toLowerCase();
        filteredList = dealers.filter(function (item) {
            var matchState = (currentState === 'ALL') || (item.state.toLowerCase() === currentState.toLowerCase());
            if (!matchState) return false;
            if (!q) return true;
            return (item.name && item.name.toLowerCase().indexOf(q) !== -1) ||
                   (item.city && item.city.toLowerCase().indexOf(q) !== -1) ||
                   (item.pin && item.pin.indexOf(q) !== -1) ||
                   (item.state && item.state.toLowerCase().indexOf(q) !== -1);
        });
        currentPage = 1;
        renderDirectory();
    }

    function renderDirectory() {
        var grid = document.getElementById('dealersGrid');
        var countText = document.getElementById('dealerCountText');
        var loadMoreBtn = document.getElementById('loadMoreDealersBtn');
        var resetBtn = document.getElementById('dealerResetBtn');
        if (!grid) return;

        var total = filteredList.length;
        var isFiltered = (currentState !== 'ALL') || (currentQuery.trim() !== '');

        if (resetBtn) {
            resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
        }

        if (countText) {
            var stateDisplay = currentState === 'Delhi' ? 'Delhi NCR' : currentState;
            var filterNote = '';
            if (isFiltered) {
                filterNote = ' <button type="button" class="np-btn-reset-filters" onclick="window.resetAllDealerFilters()">Clear</button>';
            }
            countText.innerHTML = 'Showing <strong>' + Math.min(currentPage * pageSize, total) + '</strong> of <strong>' + total + '</strong> verified dealers' +
                (currentState !== 'ALL' ? ' in <span style="color:#0094DC; font-weight:700;">' + escapeHtml(stateDisplay) + '</span>' : ' nationwide') +
                (currentQuery ? ' matching "<em>' + escapeHtml(currentQuery) + '</em>"' : '') +
                filterNote;
        }

        var visibleItems = filteredList.slice(0, currentPage * pageSize);

        if (visibleItems.length === 0) {
            grid.innerHTML = '<div class="np-no-dealers-found">' +
                '<h4>No dealers found</h4>' +
                '<p>Try searching another town, pincode, or select a state from the dropdown above.</p>' +
                '<button type="button" class="np-btn-reset-large" onclick="window.resetAllDealerFilters()">Show All 470+ Dealers</button>' +
                '</div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        var html = visibleItems.map(function (d, idx) {
            var pinBadge = d.pin ? '<span class="np-dealer-pin"><i class="fas fa-map-pin"></i> ' + escapeHtml(d.pin) + '</span>' : '';
            var stateLabel = d.state === 'Delhi' ? 'Delhi NCR' : d.state;
            var numStr = (idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1));
            return '<div class="np-dealer-card toTop is-visible">' +
                '<div class="np-dealer-card-top">' +
                    '<span class="np-dealer-num">#' + numStr + '</span>' +
                    '<span class="np-dealer-state-badge">' + escapeHtml(stateLabel) + '</span>' +
                '</div>' +
                '<h4 class="np-dealer-name">' + escapeHtml(sanitizeName(d.name)) + '</h4>' +
                '<div class="np-dealer-loc">' +
                    '<i class="fas fa-map-marker-alt"></i> ' +
                    '<span>' + escapeHtml(d.city) + (d.state ? ', ' + escapeHtml(stateLabel) : '') + '</span>' +
                '</div>' +
                '<div class="np-dealer-card-footer">' +
                    pinBadge +
                    '<span class="np-dealer-verified"><i class="fas fa-check-circle"></i> Verified Partner</span>' +
                '</div>' +
            '</div>';
        }).join('');

        grid.innerHTML = html;

        if (loadMoreBtn) {
            if (currentPage * pageSize < total) {
                var remaining = total - currentPage * pageSize;
                loadMoreBtn.style.display = 'inline-flex';
                loadMoreBtn.innerHTML = '<span>Load More Dealers (' + remaining + ' remaining)</span> <i class="fas fa-chevron-down"></i>';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.onDealerSearch = function (val) {
        currentQuery = val || '';
        var clearBtn = document.getElementById('dealerSearchClear');
        if (clearBtn) {
            clearBtn.style.display = currentQuery ? 'flex' : 'none';
        }
        applyFilters();
    };

    window.clearDealerSearch = function () {
        var input = document.getElementById('dealerSearchInput');
        if (input) input.value = '';
        currentQuery = '';
        var clearBtn = document.getElementById('dealerSearchClear');
        if (clearBtn) clearBtn.style.display = 'none';
        applyFilters();
    };

    window.resetAllDealerFilters = function () {
        currentState = 'ALL';
        currentQuery = '';
        var input = document.getElementById('dealerSearchInput');
        if (input) input.value = '';
        var select = document.getElementById('dealerStateFilter');
        if (select) select.value = 'ALL';
        var clearBtn = document.getElementById('dealerSearchClear');
        if (clearBtn) clearBtn.style.display = 'none';
        syncStatePills('ALL');
        applyFilters();
    };

    window.onDealerStateChange = function (st) {
        currentState = st || 'ALL';
        var select = document.getElementById('dealerStateFilter');
        if (select && select.value !== currentState) {
            select.value = currentState;
        }
        syncStatePills(currentState);
        applyFilters();
    };

    window.filterDirectoryByState = function (st) {
        currentState = st || 'ALL';
        var select = document.getElementById('dealerStateFilter');
        if (select) select.value = currentState;
        syncStatePills(currentState);
        applyFilters();

        var dirEl = document.getElementById('dealer-directory');
        if (dirEl) {
            $('html, body').stop().animate({
                scrollTop: $(dirEl).offset().top - 90
            }, 600);
        }
    };

    window.loadMoreDealers = function () {
        currentPage++;
        renderDirectory();
    };

    function syncStatePills(activeState) {
        var pills = document.querySelectorAll('.np-state-pill-btn');
        pills.forEach(function (btn) {
            if (btn.getAttribute('data-state') === activeState) {
                btn.classList.add('is-active');
                try {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } catch (e) {}
            } else {
                btn.classList.remove('is-active');
            }
        });
    }

    function populateStateSelect(counts, sortedStates) {
        var select = document.getElementById('dealerStateFilter');
        if (!select) return;
        var currentVal = select.value || 'ALL';
        var optsHtml = '<option value="ALL">All States</option>';
        sortedStates.forEach(function (st) {
            var label = (st === 'Delhi' ? 'Delhi NCR' : st);
            optsHtml += '<option value="' + escapeHtml(st) + '">' + escapeHtml(label) + '</option>';
        });
        select.innerHTML = optsHtml;
        select.value = currentVal;
    }

    function initStatePills() {
        var container = document.getElementById('statePillsBar');
        if (!container) return;

        // Count per state
        var counts = {};
        dealers.forEach(function (d) {
            counts[d.state] = (counts[d.state] || 0) + 1;
        });

        // Alphabetical sort (A to Z)
        var sortedStates = Object.keys(counts).sort(function (a, b) {
            return a.localeCompare(b);
        });

        // Ensure state select dropdown is also alphabetically populated
        populateStateSelect(counts, sortedStates);

        var html = '<button type="button" class="np-state-pill-btn is-active" data-state="ALL" onclick="window.onDealerStateChange(\'ALL\')">All</button>';

        sortedStates.forEach(function (st) {
            var displayLabel = st === 'Delhi' ? 'Delhi NCR' : st;
            html += '<button type="button" class="np-state-pill-btn" data-state="' + escapeHtml(st) + '" onclick="window.onDealerStateChange(\'' + escapeHtml(st) + '\')">' +
                escapeHtml(displayLabel) +
            '</button>';
        });

        container.innerHTML = html;
    }

    // Enhance onMapLocationSelect to show state dealer preview inside #panIndiaDataCard
    function enhanceMapSelection() {
        if (!window.allLocationsData) return;
        var origSelect = window.onMapLocationSelect;

        window.onMapLocationSelect = function (locKey) {
            if (origSelect) {
                origSelect(locKey);
            }

            var stateName = locKeyToState[locKey];
            var previewEl = document.getElementById('mlcStateDealersPreview');
            if (!previewEl) return;

            if (stateName) {
                var stateDealers = getDealersForState(stateName);
                if (stateDealers.length > 0) {
                    var sampleDealers = stateDealers.slice(0, 4);
                    var listHtml = sampleDealers.map(function (d) {
                        return '<div class="np-preview-dealer-item">' +
                            '<div class="np-pdi-name"><i class="fas fa-store"></i> <strong>' + escapeHtml(d.name) + '</strong></div>' +
                            '<div class="np-pdi-city"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(d.city) + (d.pin ? ' &bull; PIN ' + escapeHtml(d.pin) : '') + '</div>' +
                        '</div>';
                    }).join('');

                    previewEl.innerHTML = '<div class="np-card-dealers-box">' +
                        '<div class="np-cd-header">' +
                            '<div class="np-cd-title"><i class="fas fa-store-alt" style="color:#0094DC;"></i> <span>' + stateDealers.length + ' Authorized Dealers &amp; Stockists</span> in ' + escapeHtml(stateName) + '</div>' +
                        '</div>' +
                        '<div class="np-cd-list">' + listHtml + '</div>' +
                        '<button type="button" class="np-btn-view-state-dealers" onclick="window.filterDirectoryByState(\'' + escapeHtml(stateName) + '\')">' +
                            '<span>View All ' + stateDealers.length + ' Dealers in ' + escapeHtml(stateName) + ' Directory</span> <i class="fas fa-arrow-down"></i>' +
                        '</button>' +
                    '</div>';
                    previewEl.style.display = 'block';
                } else {
                    previewEl.style.display = 'none';
                }
            } else {
                previewEl.style.display = 'none';
            }
        };
    }

    function init() {
        dealers = (window.npDealerNetwork || []).map(function (d) {
            return {
                name: sanitizeName(d.name),
                city: d.city,
                pin: d.pin,
                state: d.state
            };
        });
        filteredList = dealers.slice();
        initStatePills();
        renderDirectory();
        enhanceMapSelection();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
