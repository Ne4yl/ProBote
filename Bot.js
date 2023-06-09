require('dotenv').config();
const puppeteer = require('puppeteer');

const url = "https://mon.lyceeconnecte.fr/auth/login#/";
const username = process.env.user_username;
const password = process.env.user_password;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto(url, {waitUntil: "domcontentloaded"});
    await page.waitForSelector(".flex-magnet-bottom-right",{
        visible: true
    });

    await page.type('#email', username);
    await page.type('#password', password);
    await sleep(1000);
    await page.click(".flex-magnet-bottom-right");
    
    
    await page.waitForSelector("a[href$='welcome']",{
        visible: true
    });
    await sleep(1000);
    await page.click("a[href$='welcome']");
    
    await page.waitForSelector("a[class='applications-item ng-scope ng-isolate-scope']",{
        visible: true
    });
    await page.click("a[class='applications-item ng-scope ng-isolate-scope']");
    
    //--------------------------------------------------------------------------------------
    
    // Onglet notes 
    await page.waitForSelector("div[id='GInterface.Instances[0].Instances[1]_Combo2']",{
        visible: true
    });
    await sleep(1000);
    await page.click("div[id='GInterface.Instances[0].Instances[1]_Combo2']");
    
    //--------------------------------------------------------------------------------------
    
    // Permet de recuperer toutes les matieres presentes dans l'html
    // matiere = ['PHYSIQ.CHIMIE&MATHS > PHYSIQ.CHIMIE&MATHS 14,00'];
    
    await sleep(750);
    const matiere = await page.$$eval("div[class='Gras Espace']", matiere_html => matiere_html.map(
        matiere_html => matiere_html.ariaLabel))
    
    let matieres = [];
    for (let i = 0; i < matiere.length; i++) {
        if (matiere[0].split(",")[0][matiere[0].split(",")[0].length-2] >= 1){
            matieres.push(matiere[i].split(",")[0].slice(0,-3));
        }
        else {
            matieres.push(matiere[i].split(",")[0].slice(0,-2));
        }
    }

    console.log(matieres);

    //--------------------------------------------------------------------------------------
    
    // Permet de recuperer toutes les notes presentes dans l'html

    await sleep(750);
    let html_content = await page.$$eval("div[class='Espace']", note_html => note_html.map(note_html=>
        note_html.ariaLabel));

    let notes = [];
    
    // Desole pour les nom de variables : notes = ['matiere de la note : la note', 'matiere de la note : la note',...];
    for (let i = 0; i < html_content.length; i++) {
        
        let parsed_content = html_content[i].split(",")[0];
        
        if (parseInt(parsed_content[parsed_content.length - 2]) >= 1) {
            notes.push(parsed_content.slice(0, parsed_content.length - 3));
            notes[i] = notes[i] + " : " + parsed_content.slice(-2) + "," + html_content[i].split(",")[1].slice(0,2);
        }
        else {
            notes.push(parsed_content.slice(0, parsed_content.length - 2));
            notes[i] = notes[i] + " : " + parsed_content.slice(-1) + "," + html_content[i].split(",")[1].slice(0,2);
            
        }

        // Regarde si la note est /20 ou non, si elle ne l'est pas elle met le bon /
        if (html_content[i].includes("<span class=Texte9>")) {
            notes[i] = notes[i] + html_content[i].split("<span class=Texte9>")[1].split("</span>")[0];
            }
    }
    console.log(notes);
    
    // if (notes.length != none_actualized_notes.length) {
    //     // Get the note which appears
    //     // send message with the note
    // }

    // --------------------------------------------------------------------------------------
    
    // // Onglet Devoirs
    // await page.waitForSelector("div[id='GInterface.Instances[0].Instances[1]_Combo1']",{
    //     visible: true
    // });
    // await sleep(1000);
    // await page.click("div[id='GInterface.Instances[0].Instances[1]_Combo1']");
    
    // await sleep(750);
    // let Devoirs = await page.$eval('.titre-matiere ', devoirs_html => devoirs_html.textContent);
    // console.log(Devoirs);
    // let _b = await page.$eval('.ie-sous-titre', devoirs_html => devoirs_html.textContent);
    // console.log(_b);



    //--------------------------------------------------------------------------------------

    // Onglet emploi du temps
    
    // cour avec : 'div[class="NoWrap ie-ellipsis"]' = cour avec chagement : cour annullé, changement de salle...
    // chaque cour = 23px de haut / heures

    await page.waitForSelector("div[id='GInterface.Instances[0].Instances[1]_Combo5']",{
        visible: true
    });
    
    await sleep(750);
    await page.click("div[id='GInterface.Instances[0].Instances[1]_Combo5']");
    
    // Pour la semaine 32
    await sleep(1750);
    await page.click("div[id='GInterface.Instances[2].Instances[0]_j_32']");
    
    await sleep(750);
    let nb_cours = await page.$$eval("div[class='EmploiDuTemps_Element AvecMain']", cours_html => cours_html.length);
    
    let cours = [];
    let cours_modified = [];
    let heure, jour, duree = [];
    
    let one_hour = await page.$eval("div[id='GInterface.Instances[2].Instances[1].Instances[0]_Zone_Grille']", cours_html => cours_html.style.height);
    one_hour = Math.floor(one_hour.slice(0,-2) / 13);
    let one_day = await page.$eval("div[id='GInterface.Instances[2].Instances[1].Instances[0]_Zone_Grille']", cours_html => cours_html.style.width);
    one_day = Math.floor(one_day.slice(0,-2) / 5);


    // Alors beh truc de fou mais a chaque fois que tu reload un onglet de pronote : cilck sur onglet note ensuite sur onglet emploi du temps alors les id des cours changent
    
    let truc_de_merde_qui_me_fait_chié = await page.$eval("div[class='EmploiDuTemps_Element AvecMain']", cours_html => cours_html.id);
    truc_de_merde_qui_me_fait_chié = truc_de_merde_qui_me_fait_chié.slice(0,-1);

    for (let j = 0; j < nb_cours; j++) {

        console.log(await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.style.visibility));

        if (await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.style.visibility == "visible")) {
            
            cours.push(await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.outerText));
            let i = cours.length - 1;
            cours_modified[i] = cours[i].split("\n")[0]; // .split("\n")[0]
                
            if (cours_modified[i].includes("Cours annulé") || cours_modified[i].includes("Prof. absent") || cours_modified[i].includes("Prof./pers. absent")) {
                cours_modified[i] = cours[i].split("\n")[0] + " : " + cours[i].split("\n\n\n")[1].split("\n")[0];
            }
                
            heure = await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.style.top);
            duree = await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.style.height);
            jour = await page.$eval("div[id='" + truc_de_merde_qui_me_fait_chié + String(j) + "']", cours_html => cours_html.style.left);
                    
            console.log("Heure = " + Math.floor((heure.slice(0,-2))/one_hour) + " / Jour = " + Math.round(jour.slice(0, -2)/one_day) + " / Duree = " + Math.floor(duree.slice(0,-2)/one_hour));
            console.log(cours_modified[i]);
            
        }
    }

    //--------------------------------------------------------------------------------------

    await sleep(5000);
    await browser.close();

})();