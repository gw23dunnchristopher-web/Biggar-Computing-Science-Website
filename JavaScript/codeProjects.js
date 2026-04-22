/* Tiny localStorage-backed project store for the Python and HTML/CSS
   editor tools. Each "project" is a single primary code file.

   API:
     CodeProjects.list(kind)            → [{id, name, updatedAt, code}, ...]
     CodeProjects.get(kind, id)         → project | null
     CodeProjects.create(kind, name, starterCode) → project
     CodeProjects.updateCode(kind, id, code)
     CodeProjects.updateName(kind, id, name)
     CodeProjects.remove(kind, id)

   kind is 'python' or 'html'. Storage key is 'bhs_code_projects_<kind>'.
*/
(function (root) {
    function key(kind) { return 'bhs_code_projects_' + kind; }

    function readAll(kind) {
        try {
            var raw = localStorage.getItem(key(kind));
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }

    function writeAll(kind, list) {
        try { localStorage.setItem(key(kind), JSON.stringify(list)); }
        catch (e) { /* quota - silently ignore for now */ }
    }

    function uid() {
        return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function list(kind) {
        var arr = readAll(kind).slice();
        arr.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
        return arr;
    }

    function get(kind, id) {
        var found = readAll(kind).find(function (p) { return p.id === id; });
        return found || null;
    }

    function create(kind, name, starterCode) {
        var p = {
            id: uid(),
            name: (name || 'Untitled').trim() || 'Untitled',
            code: starterCode || '',
            updatedAt: Date.now(),
        };
        var arr = readAll(kind);
        arr.push(p);
        writeAll(kind, arr);
        return p;
    }

    function updateCode(kind, id, code) {
        var arr = readAll(kind);
        var i = arr.findIndex(function (p) { return p.id === id; });
        if (i < 0) return false;
        arr[i].code = code;
        arr[i].updatedAt = Date.now();
        writeAll(kind, arr);
        return true;
    }

    function updateName(kind, id, name) {
        var arr = readAll(kind);
        var i = arr.findIndex(function (p) { return p.id === id; });
        if (i < 0) return false;
        arr[i].name = (name || '').trim() || arr[i].name;
        arr[i].updatedAt = Date.now();
        writeAll(kind, arr);
        return true;
    }

    function remove(kind, id) {
        var arr = readAll(kind).filter(function (p) { return p.id !== id; });
        writeAll(kind, arr);
    }

    root.CodeProjects = {
        list: list, get: get, create: create,
        updateCode: updateCode, updateName: updateName, remove: remove,
    };
})(window);
