let currentStatus = "initial";
let done = false;
let tries = 0;
const form = document.querySelector("form") as HTMLFormElement;
const url = document.querySelector("#url") as HTMLInputElement;
const website = document.querySelector("#website") as HTMLInputElement;
const ul = document.querySelector("ul.autocomplete") as HTMLUListElement;
const loadingPercent = document.querySelector(".loading-state") as HTMLDivElement;

const track = (event?: string, desc?: string, kv1?: string, kv2?: string, kv3?: string) => {
  try {
    if ((window as any).agastya) {
      (window as any).agastya.secureTrack(event, desc, kv1, kv2, kv3);
    }
  } catch (error) {}
};

interface Audit {
  id: string;
  status: number;
  auditUrlId?: number;
  finalUrl: string;
  timing: number;
  scorePerformance: number;
  scoreAccessibility: number;
  scoreBestPractices: number;
  scoreSeo: number;
  scorePwa: number;
  createdAt: Date;
  updatedAt: Date;
};

url.addEventListener("input", () => {
  if (url.value.length > 3) {
    fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(url.value)}`)
      .then(result => {
        if (!result.ok) throw new Error("error");
        return result.json();
      })
      .then((results: {
        name: string;
        domain: string;
        logo: string;
      }[]) => {
        if (results.length) ul.innerHTML = ``;
        results.forEach(result => {
          const li = document.createElement("li");
          li.innerHTML = `<div class="image" style="background-image: url('${result.logo}')"></div><strong>${result.name}</strong> <strong>${result.domain}</strong>`;
          li.addEventListener("click", () => {
            track("select-url", result.domain, result.name);
            url.value = result.domain;
            website.value = result.domain;
            startAudit();
          });
          ul.appendChild(li);
        });
      })
      .catch(error => {

      });
  }
});

const resetForm = (show = "initial") => {
  currentStatus = show;
  const divs = document.querySelectorAll("form.audit > div");
  for (let i = 0; i < divs.length; i++) {
    divs[i].setAttribute("hidden", "hidden");
  }
  const active = document.querySelector(`form.audit > div.${show}`);
  if (active) active.removeAttribute("hidden");
  loadingPercent.innerHTML = "0";
};

const startAudit = () => {
  const webpageUrl = url.value.startsWith("http") ? url.value : `http://${url.value}`;
  if (!webpageUrl || webpageUrl === "http://") return;
  url.value = "";
  ul.innerHTML = ``;
  resetForm("loading");
  done = false;
  tries = 0;
  track("audit", webpageUrl);
  fetch(`https://platform-beta.oswaldlabs.com/v1/api/audit/?url=${webpageUrl}`)
    .then(result => {
      if (!result.ok) throw new Error("error");
      return result.json();
    })
    .then((result: Audit) => {
      if (!result.id) throw new Error("no id");
      const checkInterval = setInterval(() => {
        if (tries > 10) {
          resetForm("error");
          clearInterval(checkInterval);
        } else if (done) {
          clearInterval(checkInterval);
        } else {
          tries++;
          checkAuditResult(result.id);
        }
      }, 7500);
    })
    .catch(() => {
      resetForm("error");
    });
  let percent = 0;
  const interval = setInterval(() => {
    if (percent > 99) {
      clearInterval(interval);
    } else {
      percent++;
      loadingPercent.innerHTML = percent.toString();
    }
  }, 300);
}

const checkAuditResult = (id: string) => {
  fetch(`https://platform-beta.oswaldlabs.com/v1/api/audit/${id}`)
    .then(result => {
      if (!result.ok) throw new Error("error");
      return result.json();
    })
    .then((result: Audit) => {
      if (result.status == 0) {
        // Not completed
      } else if (result.status == 2) {
        resetForm("error");
      } else {
        done = true;
        const percent = document.querySelector(".accessible-percent") as HTMLDivElement;
        percent.innerHTML = result.scoreAccessibility.toString() + "%";
        resetForm("results");
      }
    })
    .catch(() => {
      resetForm("error");
    });
};

const sendInfo = () => {
  const email = (document.querySelector("#sendemail") as HTMLInputElement).value;
  track("send-audit", email);
  resetForm("thanks");
};

form.addEventListener("submit", event => {
  event.preventDefault();
  if (currentStatus === "initial") {
    startAudit();
  } else {
    sendInfo();
  }
  return false;
});
