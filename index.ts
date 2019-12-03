const form = document.querySelector("form") as HTMLFormElement;
const url = document.querySelector("#url") as HTMLInputElement;
const ul = document.querySelector("ul.autocomplete") as HTMLUListElement;
const track = (event?: string, desc?: string, kv1?: string, kv2?: string, kv3?: string) => {
  try {
    if ((window as any).agastya) {
      (window as any).agastya.secureTrack(event, desc, kv1, kv2, kv3);
    }
  } catch (error) {}
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
            form.submit();
          });
          ul.appendChild(li);
        });
      })
      .catch(error => {

      });
  }
});
