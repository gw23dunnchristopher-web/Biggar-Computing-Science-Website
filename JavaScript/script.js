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
    window.scrollTo(0, 0);
    if (sidebarCache) {
        document.getElementById(menuID).innerHTML = sidebarCache;
        attachMenuListeners();
        setInterval(function() { countdown('2025-04-25'); }, 1000);
        return;
    }

    // If already preloading, use that promise
    if (sidebarPromise) {
        sidebarPromise.then(data => {
            document.getElementById(menuID).innerHTML = data;
            attachMenuListeners();
            setInterval(function() { countdown('2025-04-25'); }, 1000);
        });
        return;
    }

    // Otherwise load normally
    preloadSidebar(menuLoc).then(data => {
        document.getElementById(menuID).innerHTML = data;
        attachMenuListeners();
        setInterval(function() { countdown('2025-04-25'); }, 1000);
    });
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
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



function answerButtonSwitch(element){
    if (element.innerHTML == "Show Answer"){
        element.innerHTML = "Hide Answer";
        element.style.backgroundImage = "linear-gradient(to bottom, lightgreen, green)";
        
    }
    else{
        element.innerHTML = "Show Answer";
        element.style.backgroundImage = "linear-gradient(to bottom, lightgrey, lightslategrey)";
    }
}

function toggleVisibility(className) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].style.display === 'none' || getComputedStyle(elements[i]).display === 'none') {
            elements[i].style.display = 'block';
        } else {
            elements[i].style.display = 'none';
        }
    }
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

preloadSidebar('/HTML/N5/N5Sidebar.html').then(() => {
    loadSidebar('/HTML/N5/N5Sidebar.html', 'sidebar');
    document.getElementById('loading').style.display = 'none';
    document.getElementById('mainContent').classList.remove('content-hidden');
});

/* Countdown Function */
function countdown(testDate) {
    const countDownDate = new Date(testDate).getTime();
    const now = new Date().getTime();
    const distance = countDownDate - now;
    
    if (distance < 0) {
        document.getElementById("countdown").innerHTML = "EXPIRED";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
}
