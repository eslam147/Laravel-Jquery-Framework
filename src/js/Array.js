class Collection {
    constructor(items = [], name = 'Collection') {
        this.items = Array.isArray(items) ? items : Object.values(items);
        this.name = name;
    }

    all() { return this.items; }

    // ==== Filtering ====
    where(key, value) { return new Collection(this.items.filter(i=>i[key]===value)); }
    whereIn(key, arr) { return new Collection(this.items.filter(i=>arr.includes(i[key]))); }
    whereNotIn(key, arr) { return new Collection(this.items.filter(i=>!arr.includes(i[key]))); }
    whereNull(key) { return new Collection(this.items.filter(i=>i[key]==null)); }
    whereNotNull(key) { return new Collection(this.items.filter(i=>i[key]!=null)); }

    whereId(value) { return this.where('id', value); } // <-- هنا

    whereHas(relation, fn){
        return new Collection(this.items.filter(i=>{
            if(!i[relation] || !Array.isArray(i[relation])) return false;
            return fn(new Collection(i[relation]));
        }));
    }

    whereDoesntHave(relation, fn){
        return new Collection(this.items.filter(i=>{
            if(!i[relation] || !Array.isArray(i[relation])) return true;
            return !fn(new Collection(i[relation]));
        }));
    }

    having(fn) { return new Collection(this.items.filter(fn)); }

    // ==== Relationships ====
    with(relation, fn=null){
        const items = this.items.map(i=>{
            if(i[relation] && fn) i[relation] = fn(new Collection(i[relation])).all();
            return i;
        });
        return new Collection(items);
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
    sum(key) { return this.items.reduce((a,b)=>a+(b[key]||0),0); }
    avg(key) { return this.items.length ? this.sum(key)/this.items.length : 0; }
    max(key) { return Math.max(...this.items.map(i=>i[key]||-Infinity)); }
    min(key) { return Math.min(...this.items.map(i=>i[key]||Infinity)); }

    reduce(fn, init) { return this.items.reduce(fn, init); }
    tap(fn) { fn(this); return this; }
    each(fn) { this.items.forEach(fn); return this; }

    // ==== Selection ====
    pluck(key) { return new Collection(this.items.map(i=>i[key])); }

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

    sortBy(key) {
        return new Collection([...this.items].sort((a,b)=>a[key]-b[key]));
    }

    groupBy(key) {
        const grouped = {};
        this.items.forEach(i=>{
            const k=i[key];
            if(!grouped[k]) grouped[k]=[];
            grouped[k].push(i);
        });
        return new Collection(grouped);
    }

    // ==== dd ====
    dump() {
        const popup = window.open("", "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
        const doc = popup.document;
        doc.body.style.fontFamily = "Menlo, Monaco, Consolas, monospace";
        doc.body.style.background = "#18171B";
        doc.body.style.color = "#FFA500";
        doc.body.style.padding = "10px";
        doc.body.style.whiteSpace = "pre";
        doc.body.style.lineHeight = "1.2em";

        const createRow = (key, value, depth = 0, firstOpen=false) => {
            const row = doc.createElement('div');
            row.style.marginLeft = depth * 45 + "px";

            const keySpan = doc.createElement('span');
            keySpan.style.color = "#00FF00";
            keySpan.textContent = key + " => ";
            row.appendChild(keySpan);

            if(typeof value === 'object' && value !== null) {
                const isArray = Array.isArray(value);
                const typeSpan = doc.createElement('span');
                typeSpan.style.color = "#00FFFF";
                typeSpan.textContent = isArray ? `Array[${value.length}]` : "Object";
                row.appendChild(typeSpan);

                const toggle = doc.createElement('span');
                toggle.textContent = firstOpen ? "▼" : "▶";
                toggle.style.cursor = "pointer";
                toggle.style.color = "#FFA500";
                row.appendChild(toggle);

                const inner = doc.createElement('div');
                inner.style.display = firstOpen ? "block" : "none";

                const openBracket = doc.createElement('div');
                openBracket.style.marginLeft = depth * 45 + "px";
                openBracket.style.color = "#AAAAAA";
                openBracket.textContent = isArray ? "[" : "{";
                inner.appendChild(openBracket);

                Object.entries(value).forEach(([k,v])=>{
                    inner.appendChild(createRow(k,v,depth+1,false));
                });

                const closeBracket = doc.createElement('div');
                closeBracket.style.marginLeft = depth * 45 + "px";
                closeBracket.style.color = "#AAAAAA";
                closeBracket.textContent = isArray ? "]" : "}";
                inner.appendChild(closeBracket);

                toggle.onclick = () => {
                    if(inner.style.display==='none'){
                        inner.style.display='block';
                        toggle.textContent = "▼";
                    } else {
                        inner.style.display='none';
                        toggle.textContent = "▶";
                    }
                };

                row.appendChild(inner);

            } else {
                const valueSpan = doc.createElement('span');
                valueSpan.style.color = "#FFA500";
                valueSpan.textContent = value;
                row.appendChild(valueSpan);
            }

            return row;
        };

        const title = doc.createElement('div');
        title.textContent = `Collection: ${this.name} (${this.items.length})`;
        title.style.fontWeight = "bold";
        title.style.color = "#00FFFF";
        title.style.marginBottom = "10px";
        doc.body.appendChild(title);

        this.items.forEach((item,index)=>{
            const header = doc.createElement('div');
            const toggle = doc.createElement('span');
            toggle.textContent = "▼";
            toggle.style.cursor = "pointer";
            toggle.style.marginRight = "5px";
            toggle.style.color = "#FFA500";

            const indexSpan = doc.createElement('span');
            indexSpan.style.color="#00FFFF";
            indexSpan.textContent = `[${index}] ${Array.isArray(item)?'Array':'Object'}`;
            header.appendChild(toggle);
            header.appendChild(indexSpan);
            doc.body.appendChild(header);

            const inner = doc.createElement('div');
            inner.style.display = "block";

            const openBracket = doc.createElement('div');
            openBracket.style.marginLeft = "20px";
            openBracket.style.color = "#AAAAAA";
            openBracket.textContent = Array.isArray(item) ? "[" : "{";
            inner.appendChild(openBracket);

            Object.entries(item).forEach(([k,v])=>{
                inner.appendChild(createRow(k,v,1,false));
            });

            const closeBracket = doc.createElement('div');
            closeBracket.style.marginLeft = "20px";
            closeBracket.style.color = "#AAAAAA";
            closeBracket.textContent = Array.isArray(item) ? "]" : "}";
            inner.appendChild(closeBracket);

            toggle.onclick = () => {
                if(inner.style.display==='none'){
                    inner.style.display='block';
                    toggle.textContent = "▼";
                } else {
                    inner.style.display='none';
                    toggle.textContent = "▶";
                }
            };

            doc.body.appendChild(inner);
        });
    }
}

// ==== Helpers ====
window.collect = (items, name='Collection') => new Collection(items, name);
window.dd = (...args) => {
    args.forEach(a=>{
        if(a instanceof Collection) a.dump();
        else console.log(a);
    });
    throw new Error("dd stop");
};
