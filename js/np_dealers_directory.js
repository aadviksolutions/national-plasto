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
    var pageSize = 24;
    var currentPage = 1;
    var filteredList = [];

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
        if (!grid) return;

        var total = filteredList.length;
        if (countText) {
            countText.innerHTML = 'Showing <strong>' + Math.min(currentPage * pageSize, total) + '</strong> of <strong>' + total + '</strong> verified dealers' +
                (currentState !== 'ALL' ? ' in <span style="color:#0094DC; font-weight:700;">' + escapeHtml(currentState) + '</span>' : ' nationwide');
        }

        var visibleItems = filteredList.slice(0, currentPage * pageSize);

        if (visibleItems.length === 0) {
            grid.innerHTML = '<div class="np-no-dealers-found">' +
                '<i class="fas fa-store-slash"></i>' +
                '<h4>No dealers found matching your search</h4>' +
                '<p>Try searching another city or state, or apply to become an authorized dealer in this area.</p>' +
                '<button type="button" class="btn_project_default" onclick="window.clearDealerSearch()">Reset Filters</button>' +
                '</div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        var html = visibleItems.map(function (d, idx) {
            var pinBadge = d.pin ? '<span class="np-dealer-pin"><i class="fas fa-map-pin"></i> ' + escapeHtml(d.pin) + '</span>' : '';
            return '<div class="np-dealer-card toTop is-visible">' +
                '<div class="np-dealer-card-top">' +
                    '<span class="np-dealer-num">#' + (idx + 1) + '</span>' +
                    '<span class="np-dealer-state-badge">' + escapeHtml(d.state) + '</span>' +
                '</div>' +
                '<h4 class="np-dealer-name"><i class="fas fa-store"></i> ' + escapeHtml(d.name) + '</h4>' +
                '<div class="np-dealer-loc">' +
                    '<i class="fas fa-map-marker-alt"></i> ' +
                    '<span>' + escapeHtml(d.city) + (d.state ? ', ' + escapeHtml(d.state) : '') + '</span>' +
                '</div>' +
                '<div class="np-dealer-card-footer">' +
                    pinBadge +
                    '<span class="np-dealer-verified"><i class="fas fa-check-circle"></i> Authorized Partner</span>' +
                '</div>' +
            '</div>';
        }).join('');

        grid.innerHTML = html;

        if (loadMoreBtn) {
            if (currentPage * pageSize < total) {
                loadMoreBtn.style.display = 'inline-flex';
                loadMoreBtn.innerHTML = 'Load More Dealers (' + (total - currentPage * pageSize) + ' remaining) <i class="fas fa-chevron-down"></i>';
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
            clearBtn.style.display = currentQuery ? 'block' : 'none';
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
            } else {
                btn.classList.remove('is-active');
            }
        });
    }

    function initStatePills() {
        var container = document.getElementById('statePillsBar');
        if (!container) return;

        // Count per state
        var counts = {};
        dealers.forEach(function (d) {
            counts[d.state] = (counts[d.state] || 0) + 1;
        });

        var sortedStates = Object.keys(counts).sort(function (a, b) {
            return counts[b] - counts[a];
        });

        var html = '<button type="button" class="np-state-pill-btn is-active" data-state="ALL" onclick="window.onDealerStateChange(\'ALL\')">All (' + dealers.length + ')</button>';

        sortedStates.forEach(function (st) {
            html += '<button type="button" class="np-state-pill-btn" data-state="' + escapeHtml(st) + '" onclick="window.onDealerStateChange(\'' + escapeHtml(st) + '\')">' + escapeHtml(st) + ' (' + counts[st] + ')</button>';
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
        dealers = window.npDealerNetwork || [];
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
