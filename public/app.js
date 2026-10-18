async function getData(){
    try{
        const response = await fetch('/api/items?');
        const {data} = await response.json();
        // console.log(data);
        document.getElementById('list').innerHTML = data.map(i => `<li>${i.name}.${i.year}</li>`).join('');
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
 getData();