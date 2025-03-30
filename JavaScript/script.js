function brighten(event) {
    event.target.style.filter='brightness(100%) grayscale(0%)';
}

function darken(event) {
    event.target.style.filter='brightness(50%) grayscale(100%)';
}

let sidebarCache = '';
let sidebarPromise = null;

// Preload the sidebar
function preloadSidebar(menuLoc) {
    if (!sidebarPromise) {
        sidebarPromise = fetch(menuLoc)
            .then(response => response.text())
            .then(data => {
                sidebarCache = data;
                return data;
            });
    }
    return sidebarPromise;
}

function loadSidebar(menuLoc, menuID) {
    if (sidebarCache) {
        document.getElementById(menuID).innerHTML = sidebarCache;
        attachMenuListeners();
        return;
    }

    // If already preloading, use that promise
    if (sidebarPromise) {
        sidebarPromise.then(data => {
            document.getElementById(menuID).innerHTML = data;
            attachMenuListeners();
        });
        return;
    }

    // Otherwise load normally
    preloadSidebar(menuLoc).then(data => {
        document.getElementById(menuID).innerHTML = data;
        attachMenuListeners();
    });
}


function attachMenuListeners() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.stopPropagation();
            const submenu = this.querySelector('.submenu');
            const arrow = this.querySelector('.arrow');

            if (submenu) {
                // Toggle submenu visibility
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
                arrow.classList.toggle('down');
                
                // Toggle active class on the parent li
                this.classList.toggle('active');
            }
        });
    });
}

function show(element){
    document.getElementById(element).style.display = "block";
}

function hide(element){
    document.getElementById(element).style.display = "none";
}

function toggleBreakdown(breakdownId) {
    const breakdown = document.getElementById(breakdownId);
    const button = document.getElementById(breakdownId.replace('Breakdown', 'Button'));

    // Toggle visibility and active state
    if (breakdown.style.display === 'block' || getComputedStyle(breakdown).display === 'block') {
        breakdown.style.display = 'none';
        button.classList.remove('active');
    } else {
        breakdown.style.display = 'block';
        button.classList.add('active');
    }
}
