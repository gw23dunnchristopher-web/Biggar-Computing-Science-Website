(function() {
    if (!document.getElementById('a11y-script')) {
        var s = document.createElement('script');
        s.id = 'a11y-script';
        s.src = '/JavaScript/accessibility.js';
        document.head.appendChild(s);
    }

    if (!document.getElementById('sa-script')) {
        var s = document.createElement('script');
        s.id = 'sa-script';
        s.src = '/JavaScript/siteAuth.js';
        document.head.appendChild(s);
    }
})();

function brighten(event) {
    event.target.style.filter='brightness(100%) grayscale(0%)';
}

function darken(event) {
    event.target.style.filter='brightness(50%) grayscale(100%)';
}
