class DeltagerManager {
    #deltagere = [];
    #storageKey = "deltagere";

    constructor(root) {
        this.root = root; 
        this.#deltagere = this.#loadFromStorage();

        this.startnrInput = document.getElementById("startnummer");
        this.navnInput = document.getElementById("deltagernavn");
        this.sluttidInput = document.getElementById("sluttid");

        this.fraInput = document.getElementById("nedregrense");
        this.tilInput = document.getElementById("ovregrense");

        this.resultatContainer = document.getElementsByClassName("liste")[0];
        
        this.root.querySelector(".registrering")
            .querySelector("button")
            .addEventListener("click", () => this.registrerDeltager());

        //root.children[1].children[1].children[4]  Veldig kul og fin alternativ løsning. Mye lettere å lese, sier vi.
            //.addEventListener("click", () => this.visResultater());
        this.root.querySelector(".resultat")
            .querySelector("button")
            .addEventListener("click", () => this.visResultater());

    }

    #loadFromStorage() {
        const json = localStorage.getItem(this.#storageKey);
        return json ? JSON.parse(json) : [];
    }

    #saveToStorage() {
        localStorage.setItem(this.#storageKey, JSON.stringify(this.#deltagere));
    }

    #formatName(name) {
        return name
            .split(" ")
            .map(del => del.split(" ")
                .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
                .join("-")
                )
            .join(" ");
    }

    #parseTimeToSeconds(str) {
        if (!str) return NaN;

        if (str.includes(":")) {
            const parts = str.split(":").map(Number);
            if (parts.length === 2) {
                return parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        }
        return parseFloat(str.replace(",", "."));
    }

    #secondsToString(sec) {
        if (isNaN(sec)) return "?";
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }


    #beregnPlassering() {
        let sorted = [...this.#deltagere].sort((a, b) => a.tid - b.tid);
        let plassMap = {};
        let lastTid = null, lastPlass = 0;
        for (let i = 0; i < sorted.length; i++) {
            if (lastTid === null || sorted[i].tid !== lastTid) {
                lastPlass = i + 1;
                lastTid = sorted[i].tid;
            }
            plassMap[sorted[i].startnr] = lastPlass;
        }
        return plassMap;
    }

    registrerDeltager() {
        let startnr = this.startnrInput?.value || "";
        let navn = this.navnInput?.value || "";
        let sluttidStr = this.sluttidInput?.value || "";

        if (!startnr) {
            this.startnrInput.setCustomValidity("Startnummer må være numerisk verdi!");
            this.startnrInput.reportValidity();
            this.startnrInput.focus();
            return;
        }
        if (!navn) {
            this.navnInput.setCustomValidity("Du må skrive et navn!");
            this.navnInput.reportValidity();
            this.navnInput.focus();
            return; 
        }

        startnr = startnr.trim();
        navn = navn.trim();
        sluttidStr = sluttidStr.trim();

        // Takk Chat-GPT for sikkert-fungerende regex
        const nameRegex = /^[A-Za-zÆØÅæøå]+(?:[-\s][A-Za-zÆØÅæøå]+)*$/;
        if (!nameRegex.test(navn)) {
            this.navnInput.setCustomValidity("Ugyldig navn: kun bokstaver, mellomrom og bindestrek.");
            this.navnInput.reportValidity();
            this.navnInput.focus();
            return;
        } else {
            this.navnInput.setCustomValidity("");
        }

        if (this.#deltagere.some(d => d.startnr === startnr)) {
            this.startnrInput.setCustomValidity("Startnummer er allerede i bruk!");
            this.startnrInput.reportValidity();
            this.startnrInput.focus();
            return;
        } 
        else {
            this.startnrInput.setCustomValidity("");
        }

        const tid = this.#parseTimeToSeconds(sluttidStr);
        if (isNaN(tid)) {
            this.sluttidInput.setCustomValidity("Sluttid må være i format mm:ss, hh:mm:ss eller sekunder.");
            this.sluttidInput.reportValidity();
            this.sluttidInput.focus();
            return;
        } else {
            this.sluttidInput.setCustomValidity("");
        }

        const deltager = {
            startnr,
            navn: this.#formatName(navn),
            tid
        };
        this.#deltagere.push(deltager);
        this.#saveToStorage();

        this.startnrInput.value = "";
        this.navnInput.value = "";
        this.sluttidInput.value = "";
        this.startnrInput.focus();
    }

    visResultater() {
        const fra = this.fraInput?.value || "";
        const til = this.tilInput?.value || "";

        let fraSec = fra ? this.#parseTimeToSeconds(fra) : null;
        let tilSec = til ? this.#parseTimeToSeconds(til) : null;

        if (fraSec !== null && tilSec !== null && fraSec > tilSec) {
            this.tilInput.setCustomValidity("Til må være større eller lik Fra.");
            this.tilInput.reportValidity();
            this.tilInput.focus();
            return;
        } else if (fraSec !== null && tilSec !== null && fraSec <= tilSec){
            this.tilInput.setCustomValidity("");
        }   
        else {
            fraSec = 0; 
            tilSec = Number.MAX_SAFE_INTEGER;
        }

        let list = [...this.#deltagere];
        if (fraSec !== null) list = list.filter(d => d.tid >= fraSec);
        if (tilSec !== null) list = list.filter(d => d.tid <= tilSec);

        list.sort((a, b) => a.tid - b.tid);

        const plassMap = this.#beregnPlassering();

        const table = this.resultatContainer.querySelector("table");
        table.innerHTML = `
            <tr>
              <th>Plassering</th><th>Startnummer</th><th>Navn</th><th>Sluttid</th>
            </tr>
        `;
        for (let d of list) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${plassMap[d.startnr]}</td>
                <td>${d.startnr}</td>
                <td>${d.navn}</td>
                <td>${this.#secondsToString(d.tid)}</td>
            `;
            table.appendChild(tr);
        }
    }
}

const rootelement = document.getElementById("root");
new DeltagerManager(rootelement);
