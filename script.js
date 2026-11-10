
/* =====================================
   ALL LANGUAGES DICTIONARY PRO
   MAIN JAVASCRIPT ENGINE
===================================== */

// APP STORAGE

let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let history = JSON.parse(localStorage.getItem("history") || "[]");

let currentDaily = 0;
let quizIndex = 0;
let score = 0;

const dailyWords = [
  {word:"Success", meaning:"کامیابی", roman:"Kamyabi"},
  {word:"Beautiful", meaning:"خوبصورت", roman:"Khubsurat"},
  {word:"Knowledge", meaning:"علم", roman:"Ilm"},
  {word:"Confidence", meaning:"اعتماد", roman:"Aitmaad"},
  {word:"Courage", meaning:"ہمت", roman:"Himmat"},
  {word:"Reassurance", meaning:"دل کا بھروسہ", roman:"Dil ka bharosa"}
];

// COMMON HELPERS

function saveData() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  localStorage.setItem("history", JSON.stringify(history));
}

function showMessage(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function addHistory(word) {
  if (!word.trim()) return;

  history = history.filter(
    item => item.toLowerCase() !== word.toLowerCase()
  );

  history.unshift(word);
  history = history.slice(0, 50);
  saveData();
  displayHistory();
}

// PAGE NAVIGATION

function openPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageName);

  if (page) {
    page.classList.add("active");
    window.scrollTo(0, 0);
  }

  const menu = document.getElementById("sideMenu");
  if (menu) menu.classList.remove("show");

  if (pageName === "favorites") displayFavorites();
  if (pageName === "history") displayHistory();
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  if (menu) menu.classList.toggle("show");
}

// SPEECH / PRONUNCIATION

function speakWord(word, language = "en-US") {
  if (!("speechSynthesis" in window)) {
    alert("Speech is not supported on this browser.");
    return;
  }

  speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(word);
  speech.lang = language;
  speech.rate = 0.85;

  speechSynthesis.speak(speech);
}

// DICTIONARY SEARCH

async function dictionarySearch() {
  const word = document.getElementById("dictionaryInput").value.trim();
  const lang = document.getElementById("dictLanguage").value;
  const result = document.getElementById("dictionaryResult");

  if (!word) {
    result.textContent = "Please enter a word first.";
    return;
  }

  result.textContent = "Searching dictionary...";

  addHistory(word);

  try {
    if (lang !== "en") {
      const translated = await translateAPI(word, lang, "en");

      result.innerHTML = "";

      const heading = document.createElement("h2");
      heading.textContent = word;

      const meaning = document.createElement("p");
      meaning.textContent = "English meaning: " + translated;

      const note = document.createElement("p");
      note.textContent =
        "This is a translated meaning. A full native dictionary entry may not be available.";

      result.append(heading, meaning, note);
      return;
    }

    const response = await fetch(
      "https://api.dictionaryapi.dev/api/v2/entries/en/" +
      encodeURIComponent(word)
    );

    if (!response.ok) throw new Error("Word not found");

    const data = await response.json();
    const entry = data[0];

    result.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = entry.word;

    result.appendChild(title);

    if (entry.phonetic) {
      const phonetic = document.createElement("p");
      phonetic.textContent = "Pronunciation: " + entry.phonetic;
      result.appendChild(phonetic);
    }

    const listen = document.createElement("button");
    listen.textContent = "🔊 Listen";
    listen.onclick = () => speakWord(entry.word);
    result.appendChild(listen);

    entry.meanings.forEach(item => {
      const heading = document.createElement("h3");
      heading.textContent = item.partOfSpeech;

      result.appendChild(heading);

      item.definitions.slice(0, 3).forEach(def => {
        const paragraph = document.createElement("p");
        paragraph.textContent = "• " + def.definition;
        result.appendChild(paragraph);

        if (def.example) {
          const example = document.createElement("p");
          example.textContent = "Example: " + def.example;
          result.appendChild(example);
        }
      });
    });

    const favoriteButton = document.createElement("button");
    favoriteButton.textContent = "❤️ Add to Favorites";
    favoriteButton.onclick = () => addFavorite(word);
    result.appendChild(favoriteButton);

  } catch (error) {
    result.textContent =
      "Word could not be found. Check your internet connection or try another word.";
  }
}

// HOME SEARCH

function homeSearchWord() {
  const word = document.getElementById("homeSearch").value.trim();

  if (!word) {
    alert("Please enter a word.");
    return;
  }

  document.getElementById("dictionaryInput").value = word;
  openPage("dictionary");
  dictionarySearch();
}

// TRANSLATION ENGINE

async function translateAPI(text, from, to) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) +
    "&langpair=" +
    encodeURIComponent(from + "|" + to);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Translation service unavailable");
  }

  const data = await response.json();

  if (!data.responseData) {
    throw new Error("Translation unavailable");
  }

  return data.responseData.translatedText;
}

async function translateText() {
  const text = document.getElementById("translateInput").value.trim();
  const from = document.getElementById("fromLanguage").value;
  const to = document.getElementById("toLanguage").value;
  const result = document.getElementById("translateResult");

  if (!text) {
    result.textContent = "Please enter text to translate.";
    return;
  }

  result.textContent = "Translating...";

  try {
    const translated = await translateAPI(text, from, to);

    result.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Translation Result";

    const output = document.createElement("p");
    output.textContent = translated;

    const copy = document.createElement("button");
    copy.textContent = "📋 Copy Translation";
    copy.onclick = () => copyText(translated);

    result.append(title, output, copy);

  } catch (error) {
    result.textContent =
      "Translation failed. Please check your internet connection or try again.";
  }
}

// COPY TEXT

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert("Text copied!"))
      .catch(() => alert("Copy not available."));
  } else {
    alert("Please use your browser's copy option.");
  }
}

// AI DICTIONARY

async function askAI() {
  const word = document.getElementById("aiInput").value.trim();
  const language = document.getElementById("aiLanguage").value;
  const result = document.getElementById("aiResult");

  if (!word) {
    result.textContent = "Enter a word first.";
    return;
  }

  result.textContent = "Preparing word explanation...";

  try {
    let meaning = word;

    if (language === "en") {
      const response = await fetch(
        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
        encodeURIComponent(word)
      );

      if (!response.ok) throw new Error("Not found");

      const data = await response.json();

      result.innerHTML = "";

      const heading = document.createElement("h2");
      heading.textContent = data[0].word;

      result.appendChild(heading);

      data[0].meanings.forEach(item => {
        const part = document.createElement("h3");
        part.textContent = item.partOfSpeech;
        result.appendChild(part);

        item.definitions.slice(0, 3).forEach(def => {
          const paragraph = document.createElement("p");
          paragraph.textContent = def.definition;
          result.appendChild(paragraph);

          if (def.example) {
            const example = document.createElement("p");
            example.textContent = "Example: " + def.example;
            result.appendChild(example);
          }
        });
      });

      return;
    }

    const translated = await translateAPI(
      word,
      language === "roman" ? "en" : language,
      "ur"
    );

    meaning = translated;

    result.textContent =
      "Word: " + word +
      "\n\nUrdu Meaning: " + meaning +
      "\n\nNote: This is an online translation, not a full AI-generated explanation.";

  } catch (error) {
    result.textContent =
      "Explanation unavailable. Please check your internet connection.";
  }
}

// LANGUAGE SELECTION

function selectLanguage(code, name) {
  showMessage("selectedLanguage", "Selected: " + name);

  const selector = document.getElementById("dictLanguage");

  if (selector) {
    selector.value = code;
  }

  openPage("dictionary");
}

// FAVORITES

function addFavorite(word) {
  if (!word) return;

  if (!favorites.includes(word)) {
    favorites.unshift(word);
    saveData();
  }

  displayFavorites();
  alert("Added to Favorites ❤️");
}

function removeFavorite(word) {
  favorites = favorites.filter(item => item !== word);
  saveData();
  displayFavorites();
}

function displayFavorites() {
  const list = document.getElementById("favoriteList");
  if (!list) return;

  list.innerHTML = "";

  if (favorites.length === 0) {
    list.textContent = "No favorite words yet.";
    return;
  }

  favorites.forEach(word => {
    const box = document.createElement("div");
    box.className = "result-box";

    const title = document.createElement("h3");
    title.textContent = word;

    const remove = document.createElement("button");
    remove.textContent = "Remove ❤️";
    remove.onclick = () => removeFavorite(word);

    box.append(title, remove);
    list.appendChild(box);
  });
}

// HISTORY

function displayHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = "";

  if (history.length === 0) {
    list.textContent = "Your search history is empty.";
    return;
  }

  history.forEach(word => {
    const box = document.createElement("div");
    box.className = "result-box";

    const title = document.createElement("h3");
    title.textContent = word;

    box.appendChild(title);
    list.appendChild(box);
  });
}

function clearHistory() {
  if (!confirm("Clear all search history?")) return;

  history = [];
  saveData();
  displayHistory();
}

// DAILY WORD

function nextDailyWord() {
  currentDaily = (currentDaily + 1) % dailyWords.length;

  const item = dailyWords[currentDaily];

  showMessage("dailyWord", item.word);
  showMessage("dailyMeaning", item.meaning);
  showMessage("homeDailyWord", item.word);
}

function dailyPronunciation() {
  speakWord(dailyWords[currentDaily].word);
}

// THESAURUS

async function searchThesaurus() {
  const word = document.getElementById("thesaurusInput").value.trim();
  const result = document.getElementById("thesaurusResult");

  if (!word) {
    result.textContent = "Enter a word first.";
    return;
  }

  result.textContent = "Finding related words...";

  try {
    const response = await fetch(
      "https://api.datamuse.com/words?rel_syn=" +
      encodeURIComponent(word) +
      "&max=15"
    );

    const data = await response.json();

    if (!data.length) {
      result.textContent = "No synonyms found.";
      return;
    }

    result.textContent =
      "Synonyms: " + data.map(item => item.word).join(", ");

  } catch (error) {
    result.textContent = "Thesaurus service unavailable.";
  }
}

// ENGLISH TEST

const quiz = [
  {
    question: "What is the meaning of Beautiful?",
    answers: ["خوبصورت", "تیز", "کمزور"],
    correct: 0
  },
  {
    question: "What is the meaning of Success?",
    answers: ["ناکامی", "کامیابی", "خوف"],
    correct: 1
  },
  {
    question: "What is the meaning of Courage?",
    answers: ["ہمت", "غصہ", "غم"],
    correct: 0
  },
  {
    question: "What is the meaning of Knowledge?",
    answers: ["دوستی", "علم", "محنت"],
    correct: 1
  }
];

function startTest() {
  quizIndex = 0;
  score = 0;
  showQuestion();
}

function showQuestion() {
  if (quizIndex >= quiz.length) {
    showMessage(
      "question",
      "Test completed! Your score: " + score + "/" + quiz.length
    );

    document.getElementById("answers").innerHTML = "";
    showMessage("testScore", "Final Score: " + score);
    return;
  }

  const item = quiz[quizIndex];

  showMessage(
    "question",
    (quizIndex + 1) + ". " + item.question
  );

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  item.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.textContent = answer;

    button.style.display = "block";
    button.style.width = "100%";
    button.style.padding = "14px";
    button.style.margin = "8px 0";
    button.style.background = "#0878c9";
    button.style.color = "white";
    button.style.borderRadius = "8px";

    button.onclick = () => {
      if (index === item.correct) score++;

      quizIndex++;
      showMessage("testScore", "Score: " + score);
      showQuestion();
    };

    answers.appendChild(button);
  });
}

// LEARNING LESSONS

function openLesson(type) {
  const details = document.getElementById("lessonDetails");

  const lessons = {
    basic: "Hello = سلام\nGood Morning = صبح بخیر\nThank You = شکریہ",
    vocabulary: "Beautiful = خوبصورت\nSuccess = کامیابی\nKnowledge = علم",
    sentences: "My name is Danyal.\nI live in Pakistan.\nI want to learn English.",
    speaking: "Practice speaking:\nHello, how are you?\nI am fine, thank you."
  };

  details.textContent = lessons[type] || "Lesson unavailable.";
}

// OCR SCANNER

async function scanImage() {
  const file = document.getElementById("ocrImage").files[0];
  const result = document.getElementById("ocrResult");

  if (!file) {
    result.textContent = "Please select an image first.";
    return;
  }

  result.textContent = "Loading OCR engine...";

  try {
    if (!window.Tesseract) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src =
          "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
      });
    }

    result.textContent = "Scanning image...";

    const output = await Tesseract.recognize(
      file,
      "eng",
      {
        logger: info => {
          if (info.status) {
            result.textContent =
              info.status + " " +
              Math.round((info.progress || 0) * 100) + "%";
          }
        }
      }
    );

    result.textContent = output.data.text || "No text detected.";

  } catch (error) {
    result.textContent =
      "OCR failed. Please check internet and try again.";
  }
}

// TEXT EDITOR

function checkGrammar() {
  const text = document.getElementById("editorText").value.trim();

  if (!text) {
    showMessage("editorResult", "Please write something first.");
    return;
  }

  showMessage(
    "editorResult",
    "Text saved for review.\n\nWord count: " +
    text.split(/\s+/).length +
    "\n\nAutomatic grammar correction will require a grammar service."
  );
}

function clearEditor() {
  document.getElementById("editorText").value = "";
  showMessage("editorResult", "Editor cleared.");
}

// KEYBOARD

function setKeyboard(language) {
  const name = language === "ur" ? "Urdu" : "English";

  showMessage(
    "keyboardStatus",
    name + " selected. Use your phone keyboard to type."
  );
}

// DARK MODE

function toggleDarkMode() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
}

// NOTIFICATIONS

async function enableNotifications() {
  if (!("Notification" in window)) {
    showMessage(
      "notificationStatus",
      "Notifications are not supported."
    );
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    showMessage(
      "notificationStatus",
      "Notifications enabled successfully."
    );
  } else {
    showMessage(
      "notificationStatus",
      "Notification permission not granted."
    );
  }
}

// INITIALIZE APP

document.addEventListener("DOMContentLoaded", () => {

  displayFavorites();
  displayHistory();

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }

  const word = dailyWords[0];

  showMessage("dailyWord", word.word);
  showMessage("dailyMeaning", word.meaning);
  showMessage("homeDailyWord", word.word);

});
