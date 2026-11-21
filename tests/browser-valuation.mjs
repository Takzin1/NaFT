// Reuse the existing authenticated-free local Chromium/CDP smoke session.
export async function checkValuationDashboard(ev,until) {
  await ev("document.querySelector('footer a[href=\"valuation.html\"]').click();true");
  await until("document.querySelector('#amounts')?.textContent.includes('3360 円')",'P80 fixture');
  await ev(`(() => {
    for (const [id,v] of Object.entries({quantity:'3',price:'1000',fx:'150',symbol:'JPYC',deviation:'-100',fee:'100'})) {
      const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.getElementById('scenario').requestSubmit();return true;
  })()`);
  await until("document.querySelector('#amounts')?.textContent.includes('3030.30303 JPYC')",'P80 JPY peg after FX change');
  await until("document.querySelector('#amounts')?.textContent.includes('20 USD')",'P80 USD');
  await until("document.querySelector('#export')?.disabled===false && document.querySelector('#audit').textContent.includes('SCENARIO_OVERRIDE')",'P80 audit');
  await ev("document.querySelector('#deviation').value='600';document.querySelector('#scenario').requestSubmit();true");
  await until("document.querySelector('#gate')?.textContent.includes('PEG_DEVIATION') && document.querySelector('#amounts').children.length===0",'P80 fail closed');
  await ev("document.querySelector('header a').click();true");
  await until("document.querySelector('footer')?.textContent.includes('Research prototype')",'P80 return to original route');
  console.log('P80_BROWSER_PASS: original route, scenario inputs, JPY peg, USD, audit, depeg suspension');
}
