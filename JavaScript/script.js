function brighten(event) {
    event.target.style.filter='brightness(100%) grayscale(0%)';
}

function darken(event) {
    event.target.style.filter='brightness(50%) grayscale(100%)';
}

const pageContentCache = {};
let searchTimeout = null;
let pagesIndexed = false;
let pageIndex = [];

function getPageUrlsFromSidebar() {
    const links = document.querySelectorAll('.sidebar-menu a[href]:not([href="#"])');
    const urls = [];
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/HTML/N5/') && href.endsWith('.html')) {
            const title = link.textContent.trim();
            urls.push({ url: href, title: title });
        }
    });
    return urls;
}

async function fetchPageContent(url) {
    if (pageContentCache[url]) {
        return pageContentCache[url];
    }
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const contentContainer = doc.querySelector('.contentContainer');
        const content = contentContainer ? contentContainer.textContent.toLowerCase() : '';
        pageContentCache[url] = content;
        return content;
    } catch (error) {
        console.error('Error fetching page:', url, error);
        return '';
    }
}

async function buildSearchIndex() {
    if (pagesIndexed) return;
    const pages = getPageUrlsFromSidebar();
    const fetchPromises = pages.map(async (page) => {
        const content = await fetchPageContent(page.url);
        return { ...page, content: content };
    });
    pageIndex = await Promise.all(fetchPromises);
    pagesIndexed = true;
}

function searchPages() {
    const searchInput = document.getElementById('sidebarSearch');
    const searchResults = document.getElementById('searchResults');
    if (!searchInput || !searchResults) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    clearTimeout(searchTimeout);
    
    if (searchTerm.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }
    searchTimeout = setTimeout(async () => {
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        searchResults.style.display = 'block';
        
        await buildSearchIndex();
        
        const results = pageIndex.filter(page => {
            return page.content.includes(searchTerm) || page.title.toLowerCase().includes(searchTerm);
        });
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No pages found</div>';
        } else {
            let html = '<ul class="search-results-list">';
            results.forEach(page => {
                html += `<li><a href="${page.url}">${page.title}</a></li>`;
            });
            html += '</ul>';
            searchResults.innerHTML = html;
        }
    }, 300);
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
            })
            .catch(err => {
                console.error('Failed to preload sidebar:', err);
                sidebarPromise = null;
                return '';
            });
    }
    return sidebarPromise;
}

function loadSidebar(menuLoc, menuID) {
    // Ensure DOM is ready before attempting to load sidebar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadSidebarContent(menuLoc, menuID);
        });
    } else {
        loadSidebarContent(menuLoc, menuID);
    }
}

function loadSidebarContent(sidebarFile, targetElement) {
    window.scrollTo(0, 0);
    var targetEl = document.getElementById(targetElement);
    if (!targetEl) {
        console.error('Target element not found:', targetElement);
        // Try again after a short delay
        setTimeout(function() {
            loadSidebarContent(sidebarFile, targetElement);
        }, 100);
        return;
    }
    if (sidebarCache) {
        targetEl.innerHTML = sidebarCache;
        attachMenuListeners();
        setInterval(function() { countdown('2026-05-20'); }, 1000);
        return;
    }

    // If already preloading, use that promise
    if (sidebarPromise) {
        sidebarPromise.then(data => {
            targetEl.innerHTML = data;
            attachMenuListeners();
            setInterval(function() { countdown('2026-05-20'); }, 1000);
        });
        return;
    }

    // Otherwise load normally
    preloadSidebar(sidebarFile).then(data => {
        targetEl.innerHTML = data;
        attachMenuListeners();
        setInterval(function() { countdown('2026-05-20'); }, 1000);
    });
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function toggleActive(element){
    if (element.classList.contains('active')){
        element.classList.remove('active');
    }
    else {
        element.classList.add('active');
    }
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

function showMainContent() {
    var loadingEl = document.getElementById('loading');
    var mainContentEl = document.getElementById('mainContent');

    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    if (mainContentEl) {
        mainContentEl.classList.remove('content-hidden');
    }

    // Additional mobile-specific initialization
    if (window.innerWidth <= 768) {
        // Ensure mobile layout is properly initialized
        setTimeout(function() {
            var event = new Event('resize');
            window.dispatchEvent(event);
        }, 100);
    }
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

function applyButtonSwitch(element){
    if (element.innerHTML == "Apply"){
        element.innerHTML = "Remove";
        element.style.backgroundImage = "linear-gradient(to bottom, lightgreen, green)";
    }
    else{
        element.innerHTML = "Apply";
        element.style.backgroundImage = "linear-gradient(to bottom, lightgrey, lightslategrey)";
    }
}

function getActiveStyles() {
    const buttons = document.querySelectorAll('.answerButton');
    return {
        external: buttons[0].innerHTML === 'Remove',
        internal: buttons[1].innerHTML === 'Remove',
        inline: buttons[2].innerHTML === 'Remove'
    };
}

function applyExternalCSS() {
    const exampleText = document.getElementById('exampleText');
    const activeStyles = getActiveStyles();

    // Only apply if no higher precedence styles are active
    if (activeStyles.external && !activeStyles.internal && !activeStyles.inline) {
        exampleText.style.color = 'blue';
        exampleText.style.textAlign = 'left';
        exampleText.style.fontSize = '30px';
    }
}

function applyInternalCSS() {
    const exampleText = document.getElementById('exampleText');
    const activeStyles = getActiveStyles();

    // Apply styles if internal is active and no inline CSS
    if (activeStyles.internal && !activeStyles.inline) {
        exampleText.style.fontSize = '40px';
        exampleText.style.textAlign = 'right';
        if (activeStyles.external) {
            exampleText.style.color = 'blue';
        }
    }
}

function applyInlineCSS() {
    const exampleText = document.getElementById('exampleText');
    const activeStyles = getActiveStyles();

    // Inline CSS always takes precedence when active
    if (activeStyles.inline) {
        exampleText.style.color = 'red';
        exampleText.style.textAlign = 'center';
        exampleText.style.fontSize = '50px';
    }
}

function applyCSS(type) {
    const exampleText = document.getElementById('exampleText');

    // Reset all styles first
    exampleText.style.color = '';
    exampleText.style.textAlign = '';
    exampleText.style.fontSize = '';

    // Apply styles in order of precedence
    if (type === 'external') {
        applyExternalCSS();
    } else if (type === 'internal') {
        applyInternalCSS();
    } else if (type === 'inline') {
        applyInlineCSS();
    }

    // Apply other active styles
    const activeStyles = getActiveStyles();
    if (type !== 'external' && activeStyles.external) applyExternalCSS();
    if (type !== 'internal' && activeStyles.internal) applyInternalCSS();
    if (type !== 'inline' && activeStyles.inline) applyInlineCSS();
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

function toggleLaw(element) {
    const content = element.nextElementSibling;
    const arrow = element.querySelector('.arrow');

    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        if (arrow) arrow.classList.add('rotated');
        element.classList.add('active');
    } else {
        content.style.display = 'none';
        if (arrow) arrow.classList.remove('rotated');
        element.classList.remove('active');
    }
}

preloadSidebar('/HTML/N5/N5Sidebar.html').then(() => {
    loadSidebar('/HTML/N5/N5Sidebar.html', 'sidebar');
    showMainContent();
}).catch(() => {
    showMainContent();
});

setTimeout(showMainContent, 5000);

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