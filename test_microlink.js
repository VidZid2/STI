const url = "https://www.britannica.com/science/energy";
fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
