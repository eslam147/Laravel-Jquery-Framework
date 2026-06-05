class Collection {
    constructor(items, name = 'Collection') {
        this._hasWhere = false;
        if (Array.isArray(items)) {
            this.items = items;
            this.isAssoc = false;
            return;
        }
        if (items && typeof items === 'object') {
            this.items = items;
            this.isAssoc = true;
            return;
        }
        if (typeof items === 'string' || typeof items === 'number' || typeof items === 'boolean') {
            this.items = items;
            this.isAssoc = false;
            return;
        }
        this.items = [];
        this.name = name;
    }
    all() { return this.items; }
    first(callback = null, defaultValue = null) {
        const values = Object.values(this.items || {});
        if (!callback) return values[0] ?? defaultValue;
        return values.find(callback) ?? defaultValue;
    }
    last(callback = null, defaultValue = null   ) {
        const values = Object.values(this.items || {});
        if (!callback) return values[values.length - 1] ?? defaultValue;
        return values.reverse().find(callback) ?? defaultValue;
    }
    get(callback = null, defaultValue = null) {
        const values = Object.values(this.items || {});
        if (!callback) return values;
        return values.filter(callback);
    }
    has(key) {
        if (Array.isArray(this.items)) {
            return key >= 0 && key < this.items.length;
        }
        return this.items.hasOwnProperty(key);
    }
    // ================= Transformation =================
    map(callback) { return new Collection(this.items.map(callback)); }
    mapWithKeys(callback) {
        const obj = {};
        this.items.forEach(item => Object.assign(obj, callback(item)));
        return new Collection(obj);
    }
    filter(callback) { return new Collection(this.items.filter(callback)); }
    reject(callback) { return new Collection(this.items.filter(i => !callback(i))); }
    flatten(depth = Infinity) {
        const flat = (arr, d) => arr.reduce((acc, val) => {
            if (Array.isArray(val) && d > 0) return acc.concat(flat(val, d - 1));
            else return acc.concat(val);
        }, []);
        return new Collection(flat(this.items, depth));
    }
    collapse() {
        return new Collection(this.items.reduce((acc, val) => acc.concat(val), []));
    }
    operators() {
        return {
            '=':      (a, b) => a === b,
            '!=':     (a, b) => a !== b,
            '>':      (a, b) => a > b,
            '<':      (a, b) => a < b,
            '>=':     (a, b) => a >= b,
            '<=':     (a, b) => a <= b,
            'in':     (a, b) => Array.isArray(b) && b.includes(a),
            'not in': (a, b) => Array.isArray(b) && !b.includes(a),
            'like':   (a, b) => {
                if (typeof a !== 'string') return false;
                const regex = new RegExp('^' + b.replace(/%/g, '.*') + '$', 'i');
                return regex.test(a);
            }
        };

    }
    // ==== Filtering ====
    where(key, operator = '=', value = null) {
        if (typeof key === 'function') {
            const subQuery = new Collection(this.items);
            key(subQuery);
            this.items = subQuery.items;
            this._hasWhere = true;
            return this;
        }
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }
        const items = Array.isArray(this.items)
            ? this.items
            : Object.values(this.items);
        this._hasWhere = true;
        this.items = items.filter(item => this.operators()[operator](item[key], value));
        return this;
    }
    orWhere(key, operator = '=', value = null) {
        if (!this._hasWhere) {
            throw new Error('orWhere() cannot be used before where()');
        }
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }
        const matched = this.items.filter(item =>
            this.operators()[operator](item[key], value)
        );
        this.items = [
            ...this.items,
            ...matched.filter(i => !this.items.includes(i))
        ];
        return this;
    }
    whereIn(key, arr) {
        this.items = this.items.filter(i=>arr.includes(i[key]));
        return this;
    }
    whereNotIn(key, arr) {
        this.items = this.items.filter(i=>!arr.includes(i[key]));
        return this;
    }
    whereNull(key) {
        this.items = this.items.filter(i=>i[key]==null);
        return this;
    }
    whereNotNull(key) {
        this.items = this.items.filter(i=>i[key]!=null);
        return this;
    }
    whereId(value) {
        this.items = this.items.filter(i=>i.id===value);
        return this;
    }
    whereHas(relation, fn){
        return new Collection(this.items.filter(item => {
            const related = item[relation];
            if (!Array.isArray(related)) return false;
            const query = new Collection(related);
            fn(query);
            return query.isNotEmpty();
        }));
    }
    whereDoesntHave(relation, fn) {
        return new Collection(this.items.filter(item => {
            const related = item[relation];
            if (!Array.isArray(related)) return true;
            let query = new Collection(related);
            fn(query);
            return query.isEmpty();
        }));
    }
    having(key, operator = '=', value = null) {
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }
        this.items = this.items.filter(item => this.operators()[operator](item[key], value));
        return this;
    }
    // ==== Relationships ====
    relationItems(source) {
        if (source instanceof Collection) return source.toArray();
        if (Array.isArray(source)) return source;
        if (source && typeof source === 'object') return Object.values(source);
        return [];
    }
    resolveRelationSource(relation) {
        if (typeof relation !== 'string') return null;
        if (typeof globalThis !== 'undefined' && globalThis.__collectionRelationScope && relation in globalThis.__collectionRelationScope) {
            return globalThis.__collectionRelationScope[relation];
        }
        if (typeof window !== 'undefined' && window.__collectionRelationScope && relation in window.__collectionRelationScope) {
            return window.__collectionRelationScope[relation];
        }
        if (typeof window !== 'undefined' && window[relation] !== undefined) return window[relation];
        if (typeof globalThis !== 'undefined' && globalThis[relation] !== undefined) return globalThis[relation];
        return null;
    }
    guessForeignKey(relatedItems, localKey) {
        const parentItems = Array.isArray(this.items)
            ? this.items
            : Object.values(this.items || {});
        const parentValues = new Set(parentItems
            .map(item => item && item[localKey])
            .filter(value => value !== undefined && value !== null));
        const keys = [...new Set(relatedItems.flatMap(item => (
            item && typeof item === 'object' ? Object.keys(item) : []
        )))].filter(key => key.endsWith('_id'));
        let bestKey = null;
        let bestScore = 0;
        keys.forEach(key => {
            const score = relatedItems.reduce((count, item) => (
                count + (item && parentValues.has(item[key]) ? 1 : 0)
            ), 0);
            if (score > bestScore) {
                bestKey = key;
                bestScore = score;
            }
        });
        return bestKey;
    }
    normalizeRelationResult(result, relationCollection) {
        if (result instanceof Collection) return result.toArray();
        if (Array.isArray(result)) return result;
        if (result && typeof result === 'object') return Object.values(result);
        return relationCollection.toArray();
    }
    with(relation, related = null, localKey = 'id', foreignKey = null, fn = null){
        if (typeof related === 'function') {
            fn = related;
            related = null;
        }
        if (typeof foreignKey === 'function') {
            fn = foreignKey;
            foreignKey = null;
        }
        const relationParts = typeof relation === 'string'
            ? relation.split('.').filter(Boolean)
            : [];
        if (relationParts.length > 1) {
            const parentRelation = relationParts.shift();
            const nestedRelation = relationParts.join('.');
            return this.with(parentRelation, related, localKey, foreignKey, (query) => {
                query.with(nestedRelation, fn);
                return query;
            });
        }
        const relationSource = related ?? this.resolveRelationSource(relation);
        if (relationSource === null || relationSource === undefined) {
            const items = Array.isArray(this.items)
                ? this.items
                : Object.values(this.items || {});
            this.items = items.map(item => {
                if (item && item[relation] && fn) {
                    const relationCollection = new Collection(this.relationItems(item[relation]));
                    const result = fn(relationCollection, item);
                    item[relation] = this.normalizeRelationResult(result, relationCollection);
                }
                return item;
            });
            return this;
        }
        const relatedItems = this.relationItems(relationSource);
        const resolvedForeignKey = foreignKey || this.guessForeignKey(relatedItems, localKey);
        if (!resolvedForeignKey) {
            throw new Error(`with("${relation}") needs a foreign key`);
        }
        const items = Array.isArray(this.items)
            ? this.items
            : Object.values(this.items || {});
        this.items = items.map(item => {
            if (!item || typeof item !== 'object') return item;
            const matches = relatedItems.filter(relatedItem => (
                relatedItem && item[localKey] === relatedItem[resolvedForeignKey]
            ));
            const relationCollection = new Collection(matches);
            const result = fn ? fn(relationCollection, item) : relationCollection;
            return {
                ...item,
                [relation]: this.normalizeRelationResult(result, relationCollection)
            };
        });
        return this;
    }
    // ==== Joins ====
    join(otherCollection, localKey, foreignKey, alias=null){
        const joined = [];
        this.items.forEach(item=>{
            otherCollection.items.forEach(other=>{
                if(item[localKey]===other[foreignKey]){
                    joined.push({...item, ...(alias?{[alias]:other}:other)});
                }
            });
        });
        return new Collection(joined);
    }
    leftJoin(otherCollection, localKey, foreignKey, alias=null){
        const joined=[];
        this.items.forEach(item=>{
            let matched=false;
            otherCollection.items.forEach(other=>{
                if(item[localKey]===other[foreignKey]){
                    joined.push({...item, ...(alias?{[alias]:other}:other)});
                    matched=true;
                }
            });
            if(!matched) joined.push({...item});
        });
        return new Collection(joined);
    }
    rightJoin(otherCollection, localKey, foreignKey, alias=null){
        const joined=[];
        otherCollection.items.forEach(other=>{
            let matched=false;
            this.items.forEach(item=>{
                if(item[localKey]===other[foreignKey]){
                    joined.push({...item, ...(alias?{[alias]:other}:other)});
                    matched=true;
                }
            });
            if(!matched) joined.push({...other});
        });
        return new Collection(joined);
    }
    fullJoin(otherCollection, localKey, foreignKey, alias=null){
        const joined=[];
        const usedOther=new Set();
        this.items.forEach(item=>{
            let matched=false;
            otherCollection.items.forEach((other,i)=>{
                if(item[localKey]===other[foreignKey]){
                    joined.push({...item, ...(alias?{[alias]:other}:other)});
                    matched=true;
                    usedOther.add(i);
                }
            });
            if(!matched) joined.push({...item});
        });
        otherCollection.items.forEach((other,i)=>{
            if(!usedOther.has(i)) joined.push({...other});
        });
        return new Collection(joined);
    }
    // ==== Aggregates ====
    sum(key) {
        return this.items.reduce((a,b)=>a+(b[key]||0),0);
    }
    avg(key) {
        return this.items.length ? this.sum(key)/this.items.length : 0;
    }
    max(key) {
        return Math.max(...this.items.map(i=>i[key]||-Infinity));
    }
    min(key) {
        return Math.min(...this.items.map(i=>i[key]||Infinity));
    }
    reduce(fn, init) {
        return this.items.reduce(fn, init);
    }
    tap(fn) {
        fn(this);
        return this;
    }
    each(fn) {
        this.items.forEach(fn);
        return this;
    }

    // ==== Selection ====
    pluck(key, valueKey = null) {
        if (valueKey) {
            const result = {};
            this.items.forEach(item => {
                result[item[valueKey]] = item[key];
            });
            return new Collection(result);
        }
        return new Collection(this.items.map(item => item[key]));
    }
    select(keys) {
        return new Collection(this.items.map(item=>{
            const newItem = {};
            keys.forEach(k=>{
                if(k in item) newItem[k] = item[k];
            });
            return newItem;
        }));
    }
    unique(key) {
        const seen = new Set();
        return new Collection(this.items.filter(i=>{
            const val = i[key];
            if(seen.has(val)) return false;
            seen.add(val);
            return true;
        }));
    }

    sort(callback) {
        return new Collection([...this.items].sort(callback));
    }
    sortBy(key) {
        return new Collection(this.items.sort((a,b)=> (a[key] > b[key]?1:(a[key]<b[key]?-1:0))));
    }
    sortByDesc(key) {
        return new Collection(this.items.sort((a,b)=> (a[key] < b[key]?1:(a[key]>b[key]?-1:0))));
    }
    reverse() {
        return new Collection([...this.items].reverse());
    }
    shuffle() {
        return new Collection([...this.items].sort(()=>Math.random()-0.5));
    }
    // ================= Adding & Removing =================
    push(item) { return new Collection([...this.items, item]); }
    prepend(item) { return new Collection([item, ...this.items]); }
    pop() {
        this.items.pop();
        return this;
    }
    shift() {
        this.items.shift();
        return this;
    }
    merge(items) {
        this.items = [...this.items, ...items];
        return this;
    }
    concat(items) {
        this.items = [...this.items, ...items];
        return this;
    }
    union(items) {
        const set = new Set([...this.items, ...items]);
        this.items = Array.from(set);
        return this;
    }
    contains(value) {
        return this.items.includes(value);
    }
    search(value) {
        return this.items.indexOf(value);
    }
    firstWhere(key, val) {
        return this.items.find(i => i[key] === val) ?? null;
    }
    lastWhere(key, val) {
        return this.items.reverse().find(i => i[key] === val) ?? null;
    }
    groupBy(key) {
        const grouped = {};
        this.items.forEach(item => {
            const k = item[key];
            if (!grouped[k]) grouped[k] = [];
            grouped[k].push(item);
        });
        return new Collection(grouped);
    }
    keyBy(key) {
        const keyed = {};
        this.items.forEach(item => {
            const k = typeof key === 'function' ? key(item) : item[key];
            keyed[k] = item;
        });
        return new Collection(keyed);
    }
    chunk(size) {
        const chunks = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(new Collection(this.items.slice(i, i + size)));
        }
        return new Collection(chunks);
    }
    // ================= Checking =================
    isEmpty() {
        if (Array.isArray(this.items)) return this.items.length === 0;
        if (this.items && typeof this.items === 'object')
            return Object.keys(this.items).length === 0;
        return !this.items;
    }
    isNotEmpty() {
        return !this.isEmpty();
    }
    every(callback) {
        return this.items.every(callback);
    }
    some(callback) {
        return this.items.some(callback);
    }
    // ================= Conversion =================
    toArray() {
        if (Array.isArray(this.items)) return [...this.items];
        if (this.items && typeof this.items === 'object')
            return Object.values(this.items);
        return [];
    }
    toJSON() {
        return JSON.stringify(this.items, null, 2);
    }
    jsonSerialize() { return this.toJSON(); }
    // ==== dd ====
    isPrimitive = (val) =>
        val === null ||
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean';

    isPlainObject = (val) =>
        Object.prototype.toString.call(val) === '[object Object]';

    isArray = (val) => Array.isArray(val);
    dump() {
        const popup = window.open("", "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
        const doc = popup.document;
        doc.body.style.fontFamily = "Menlo, Monaco, Consolas, monospace";
        doc.body.style.background = "#18171B";
        doc.body.style.color = "#FFA500";
        doc.body.style.padding = "10px";
        doc.body.style.whiteSpace = "pre";
        doc.body.style.lineHeight = "1.2em";
        const createRow = (key, value, depth = 0, firstOpen=false, isArray=false) => {
            const row = doc.createElement('div');
            row.style.marginLeft = depth * 20 + "px";
            const keySpan = doc.createElement('span');
            if(isArray == true)
            {
                keySpan.style.color = !isNaN(key) ? "#1299DA" : "#56DB3A";
                keySpan.textContent = !isNaN(key) ? key : `"${key}"`;
            }
            else if(isArray == false && typeof value === 'object' && value !== null)
            {
                var rowSpan = doc.createElement('span');
                rowSpan.style.color = "#FF8400";
                rowSpan.textContent = `+"`;
                var valueSpan = doc.createElement('span');
                valueSpan.style.color = "#fff";
                valueSpan.textContent = key;
                rowSpan.appendChild(valueSpan);
                var quoteClose = doc.createElement('span');
                quoteClose.style.color = "#FF8400";
                quoteClose.textContent = `"`;
                rowSpan.appendChild(quoteClose);
                keySpan.style.color = !isNaN(key) ? "#1299DA" : "#fff";
                keySpan.appendChild(rowSpan);
            }
            else
            {
                var rowSpan = doc.createElement('span');
                rowSpan.style.color = "#FF8400";
                rowSpan.textContent = `+"`;
                var valueSpan = doc.createElement('span');
                valueSpan.style.color = "#fff";
                valueSpan.textContent = key;
                rowSpan.appendChild(valueSpan);
                var quoteClose = doc.createElement('span');
                quoteClose.style.color = "#FF8400";
                quoteClose.textContent = `"`;
                rowSpan.appendChild(quoteClose);
                keySpan.style.color = !isNaN(key) ? "#1299DA" : "#fff";
                keySpan.appendChild(rowSpan);
            }
            row.appendChild(keySpan);
            const raySpan = doc.createElement('span');
            raySpan.style.color = "#FF8400";
            raySpan.textContent = isArray == true ? " => " : ": ";
            row.appendChild(raySpan);
            if(typeof value === 'object' && value !== null) {
                const isArray = Array.isArray(value);
                const typeSpan = doc.createElement('span');
                typeSpan.style.color = "#1299DA";
                if(isArray) {
                    typeSpan.textContent = `array:${value.length} `;
                    // crate prackts span
                    const openBracket = doc.createElement('span');
                    openBracket.textContent = "[";
                    openBracket.style.color = "#FF8400";
                    typeSpan.appendChild(openBracket);
                    const toggle = doc.createElement('span');
                    toggle.textContent = firstOpen ? "▼" : "▶";
                    toggle.style.cursor = "pointer";
                    toggle.style.color = "#A0A0A0";
                    typeSpan.appendChild(toggle);
                    const inner = doc.createElement('div');
                    inner.style.display = firstOpen ? "block" : "none";
                    Object.entries(value).forEach(([k,v])=>{
                        inner.appendChild(createRow(k,v,depth,false,true));
                    });
                    typeSpan.appendChild(inner);
                    const closeBracket = doc.createElement('span');
                    closeBracket.textContent = "]";
                    closeBracket.style.color = "#FF8400";
                    typeSpan.appendChild(closeBracket);
                    row.appendChild(typeSpan);
                    toggle.onclick = () => {
                        if(inner.style.display==='none'){
                            inner.style.display='block';
                            toggle.textContent = "▼";
                        } else {
                            inner.style.display='none';
                            toggle.textContent = "▶";
                        }
                    };
                } else {
                    const openBracket = doc.createElement('span');
                    openBracket.textContent = "{";
                    openBracket.style.color = "#FF8400";
                    typeSpan.appendChild(openBracket);
                    const toggle = doc.createElement('span');
                    toggle.textContent = firstOpen ? "▼" : "▶";
                    toggle.style.cursor = "pointer";
                    toggle.style.color = "#A0A0A0";
                    typeSpan.appendChild(toggle);
                    const inner = doc.createElement('div');
                    inner.style.display = firstOpen ? "block" : "none";
                    Object.entries(value).forEach(([k,v])=>{
                        inner.appendChild(createRow(k,v,depth,false,false));
                    });
                    typeSpan.appendChild(inner);
                    const closeBracket = doc.createElement('span');
                    closeBracket.textContent = "}";
                    closeBracket.style.color = "#FF8400";
                    typeSpan.appendChild(closeBracket);
                    row.appendChild(typeSpan);
                    toggle.onclick = () => {
                        if(inner.style.display==='none'){
                            inner.style.display='block';
                            toggle.textContent = "▼";
                        } else {
                            inner.style.display='none';
                            toggle.textContent = "▶";
                        }
                    };
                }
            } else {
                var rowSpan = doc.createElement('span');
                if (typeof value === 'string') {
                    rowSpan.style.color = "#FF8400";
                    rowSpan.textContent = `"`;
                    var valueSpan = doc.createElement('span');
                    valueSpan.style.color = "#56DB3A";
                    valueSpan.textContent = value;
                    rowSpan.appendChild(valueSpan);
                    var quoteClose = doc.createElement('span');
                    quoteClose.style.color = "#FF8400";
                    quoteClose.textContent = `"`;
                    rowSpan.appendChild(quoteClose);
                } else {
                    rowSpan.style.color = "#1299DA";
                    rowSpan.textContent = value;
                }
                row.appendChild(rowSpan);
            }
            return row;
        };
        const title = doc.createElement('div');
        title.className = "title";
        var TopenBracket = doc.createElement('span');
        var TcloseBracket = doc.createElement('span');
        if(typeof this.items === 'object' || Array.isArray(this.items)){
            var isArrayItems = this.isAssoc ? 'Object' : 'Array';
        }
        else {
            var isArrayItems = '';
        }
        if(isArrayItems === 'Array') {
            isArrayItems = "array:" + this.items.length;
            var arrayLength = doc.createElement('span');
            arrayLength.textContent = isArrayItems;
            arrayLength.style.color = "#1299DA";
            title.appendChild(arrayLength);
            TopenBracket.textContent = " [";
            TopenBracket.style.color = "#ff8400";
            // create toggle for inner
            var toggle = doc.createElement('span');
            toggle.textContent = "▼";
            toggle.style.cursor = "pointer";
            toggle.style.color = "#A0A0A0";
            TopenBracket.appendChild(toggle);
            TcloseBracket.textContent = "]";
            TcloseBracket.style.color = "#ff8400";
            toggle.onclick = () => {
                if(inner.style.display==='none'){
                    inner.style.display='block';
                    toggle.textContent = "▼";
                } else {
                    inner.style.display='none';
                    toggle.textContent = "▶";
                }
            }
        } else if(isArrayItems === 'Object') {
            TopenBracket.textContent = "{";
            TopenBracket.style.color = "#ff8400";
            // create toggle for inner
            var toggle = doc.createElement('span');
            toggle.textContent = "▼";
            toggle.style.cursor = "pointer";
            toggle.style.color = "#A0A0A0";
            TopenBracket.appendChild(toggle);
            TcloseBracket.textContent = "}";
            TcloseBracket.style.color = "#ff8400";
            toggle.onclick = () => {
                if(inner.style.display==='none'){
                    inner.style.display='block';
                    toggle.textContent = "▼";
                } else {
                    inner.style.display='none';
                    toggle.textContent = "▶";
                }
            }
        }
        const inner = doc.createElement('div');
        inner.className = "inner";
        inner.style.display = "block";
        if(typeof this.items === 'object' || Array.isArray(this.items)){
            title.appendChild(TopenBracket);
            $.each(this.items, (index, item)=>{
                const header = doc.createElement('div');
                header.className = "header";
                header.style.marginLeft = "20px";
                const indexSpan = doc.createElement('span');
                var content = doc.createElement('div');
                content.className = "content";
                content.style.marginLeft = "20px";
                const arrow = doc.createElement('span');
                arrow.textContent = (Array.isArray(this.items)) ? " => " : ": ";
                arrow.style.color = "#FF8400";
                if(this.isPlainObject(item)){
                    const openBracket = doc.createElement('span');
                    openBracket.style.marginLeft = "5px";
                    openBracket.style.color = "#1299DA";
                    openBracket.appendChild(arrow);
                    const arrayLength = doc.createElement('span');
                    arrayLength.textContent = (Array.isArray(item)) ? "array:"+ item.length : "";
                    arrayLength.style.color = "#1299DA";
                    openBracket.appendChild(arrayLength);
                    const openBracketOpen = doc.createElement('span');
                    openBracketOpen.style.marginLeft = "5px";
                    openBracketOpen.style.color = "#FF8400";
                    openBracketOpen.textContent = (Array.isArray(item)) ? " [": " {";
                    const toggle = doc.createElement('span');
                    toggle.textContent = "▶";
                    toggle.style.cursor = "pointer";
                    toggle.style.color = "#A0A0A0";
                    openBracket.appendChild(openBracketOpen);
                    indexSpan.style.color=(Array.isArray(item)) ? "#1299DA" : "#fff";
                    const closeBracket = doc.createElement('span');
                    const closeBracketClose = doc.createElement('span');
                    closeBracketClose.style.color = "#FF8400";
                    closeBracketClose.textContent = (Array.isArray(item)) ? "]": "}";
                    closeBracket.appendChild(closeBracketClose);
                    closeBracket.style.color = "#1299DA";
                    header.appendChild(closeBracket);
                    var quoteOpen = doc.createElement('span');
                    quoteOpen.style.color = "#FF8400";
                    quoteOpen.textContent = (Array.isArray(this.items)) ? (!isNaN(index) ? `` : `"`) : `+"`;
                    indexSpan.appendChild(quoteOpen);
                    var indexSpanText = doc.createElement('span');
                    indexSpanText.style.color = (Array.isArray(this.items)) ? "#1299DA" : "#fff";
                    indexSpanText.textContent = index;
                    indexSpan.appendChild(indexSpanText);
                    var quoteClose = doc.createElement('span');
                    quoteClose.style.color = "#FF8400";
                    quoteClose.textContent = (!isNaN(index) ? `` : `"`);
                    indexSpan.appendChild(quoteClose);
                    openBracket.appendChild(toggle);
                    header.appendChild(indexSpan);
                    header.appendChild(openBracket);
                    $.each(item, (k,v)=>{
                        content.appendChild(createRow(k,v,1,false,false));
                    });
                    content.appendChild(closeBracket);
                    header.appendChild(content);
                    header.appendChild(closeBracket);
                    toggle.onclick = () => {
                        if(content.style.display==='none'){
                            content.style.display='block';
                            toggle.textContent = "▼";
                        } else {
                            content.style.display='none';
                            toggle.textContent = "▶";
                        }
                    };
                } else if(Array.isArray(item)){
                    const openBracket = doc.createElement('span');
                    openBracket.style.marginLeft = "5px";
                    openBracket.style.color = "#1299DA";
                    openBracket.appendChild(arrow);
                    const arrayLength = doc.createElement('span');
                    arrayLength.textContent = (Array.isArray(item)) ? "array:"+ item.length : "";
                    arrayLength.style.color = "#1299DA";
                    openBracket.appendChild(arrayLength);
                    const openBracketOpen = doc.createElement('span');
                    openBracketOpen.style.marginLeft = "5px";
                    openBracketOpen.style.color = "#FF8400";
                    openBracketOpen.textContent = (Array.isArray(item)) ? " [": " {";
                    const toggle = doc.createElement('span');
                    toggle.textContent = "▶";
                    toggle.style.cursor = "pointer";
                    toggle.style.color = "#A0A0A0";
                    openBracket.appendChild(openBracketOpen);
                    indexSpan.style.color=(Array.isArray(item)) ? "#1299DA" : "#fff";
                    const closeBracket = doc.createElement('span');
                    const closeBracketClose = doc.createElement('span');
                    closeBracketClose.style.color = "#FF8400";
                    closeBracketClose.textContent = (Array.isArray(item)) ? "]": "}";
                    closeBracket.appendChild(closeBracketClose);
                    closeBracket.style.color = "#1299DA";
                    header.appendChild(closeBracket);
                    var quoteOpen = doc.createElement('span');
                    quoteOpen.style.color = "#FF8400";
                    quoteOpen.textContent = (Array.isArray(this.items)) ? (!isNaN(index) ? `` : `"`) : `+"`;
                    indexSpan.appendChild(quoteOpen);
                    var indexSpanText = doc.createElement('span');
                    indexSpanText.style.color = (Array.isArray(this.items)) ? "#1299DA" : "#fff";
                    indexSpanText.textContent = index;
                    indexSpan.appendChild(indexSpanText);
                    var quoteClose = doc.createElement('span');
                    quoteClose.style.color = "#FF8400";
                    quoteClose.textContent = (!isNaN(index) ? `` : `"`);
                    indexSpan.appendChild(quoteClose);
                    openBracket.appendChild(toggle);
                    header.appendChild(indexSpan);
                    header.appendChild(openBracket);
                    $.each(item, (k,v)=>{
                        content.appendChild(createRow(k,v,1,false,true));
                    });
                    content.appendChild(closeBracket);
                    header.appendChild(content);
                    header.appendChild(closeBracket);
                    toggle.onclick = () => {
                        if(content.style.display==='none'){
                            content.style.display='block';
                            toggle.textContent = "▼";
                        } else {
                            content.style.display='none';
                            toggle.textContent = "▶";
                        }
                    };
                } else {
                    // create quote open and close
                    var quoteOpen = doc.createElement('span');
                    quoteOpen.style.color = "#FF8400";
                    quoteOpen.textContent = (Array.isArray(this.items)) ? (!isNaN(index) ? `` : `"`) : `+"`;
                    indexSpan.appendChild(quoteOpen);
                    var indexSpanText = doc.createElement('span');
                    indexSpanText.style.color = (Array.isArray(this.items)) ? "#1299DA" : "#fff";
                    indexSpanText.textContent = index;
                    indexSpan.appendChild(indexSpanText);
                    var quoteClose = doc.createElement('span');
                    quoteClose.style.color = "#FF8400";
                    quoteClose.textContent = (!isNaN(index) ? `` : `"`);
                    indexSpan.appendChild(quoteClose);
                    header.appendChild(indexSpan);
                    header.appendChild(arrow);
                    var rowSpan = doc.createElement('span');
                    if (typeof item === 'string') {
                        rowSpan.style.color = "#FF8400";
                        rowSpan.textContent = (Array.isArray(this.items)) ? `"` : `+"`;
                        var valueSpan = doc.createElement('span');
                        valueSpan.style.color = "#56DB3A";
                        valueSpan.textContent = item;
                        rowSpan.appendChild(valueSpan);
                        var quoteClose = doc.createElement('span');
                        quoteClose.style.color = "#FF8400";
                        quoteClose.textContent = `"`;
                        rowSpan.appendChild(quoteClose);
                    } else {
                        rowSpan.style.color = "#1299DA";
                        rowSpan.textContent = item;
                    }
                    header.appendChild(rowSpan);
                }
                inner.appendChild(header);
                content.style.display = "none";
            });
            title.style.marginBottom = "10px";
            title.appendChild(inner);
            title.appendChild(TcloseBracket);
        }
        else {
            if(typeof this.items === 'string'){
                const rowSpan = doc.createElement('span');
                rowSpan.style.color = "#FF8400";
                rowSpan.textContent = `"`;
                var valueSpan = doc.createElement('span');
                valueSpan.style.color = "#56DB3A";
                valueSpan.textContent = this.items;
                rowSpan.appendChild(valueSpan);
                var quoteClose = doc.createElement('span');
                quoteClose.style.color = "#FF8400";
                quoteClose.textContent = `"`;
                rowSpan.appendChild(quoteClose);
                inner.appendChild(rowSpan)
                title.appendChild(inner);
            } else {
                const rowSpan = doc.createElement('span');
                rowSpan.style.color = "#1299DA";
                rowSpan.textContent = this.items;
                inner.appendChild(rowSpan);
                title.appendChild(inner);
            }
        }
        doc.body.appendChild(title);
    }
}

// ==== Helpers ====
window.collect = (items, name='Collection') => new Collection(items, name);
window.dd = (...args) => {
    args.forEach(a => {
        if (a instanceof Collection) {
            a.dump();
            return;
        }
        collect(a, 'Auto Collection').dump();
    });

    throw new Error("dd stop");
};
