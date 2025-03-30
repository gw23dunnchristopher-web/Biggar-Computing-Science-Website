function brighten() {
    this.style.filter='brightness(100%)';
    this.style.filter='greyscale(0%)';
}

function darken() {
    this.style.filter='brightness(50%)';
    this.style.filter='greyscale(100%)';
}

function loadSidebar(menuLoc, menuID) {
    fetch(menuLoc)
        .then(response => response.text())
        .then(data => {
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
