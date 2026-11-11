(()=>{'use strict';
const $=id=>document.getElementById(id), n=id=>Math.max(0,Number($(id)?.value)||0), won=x=>Math.round(x).toLocaleString('ko-KR')+'원';
let assets=[['부동산',0],['예금·금융재산',0],['주식·출자지분',0],['사업용 재산',0],['기타 재산·채권',0]];
const checklist=['부동산 등기·실소유 확인','금융기관 전체 잔액 및 사망 전 거래내역 확인','사망 전 고액 인출·이체 사용처 확인','보험료 부담자·보험수익자 확인','퇴직금·신탁재산 확인','비상장주식·법인 지분 평가','상속인 10년·비상속인 5년 내 증여 확인','채무의 실재성·실제 부담 확인','상속개시일 기준 평가자료 확보','명의신탁·차명재산 및 해외재산 확인'];
$('checks').innerHTML=checklist.map((s,i)=>`<label><input type="checkbox" class="ck" data-i="${i}"><span>${s}</span></label>`).join('');
function renderAssets(){ $('assets').innerHTML=assets.map((a,i)=>`<div class="asset"><label>재산 종류<input data-name="${i}" value="${esc(a[0])}"></label><label>평가액(원)<input data-value="${i}" type="number" min="0" value="${a[1]}"></label><button data-remove="${i}" aria-label="삭제">삭제</button></div>`).join('');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('assets').addEventListener('input',e=>{let i=e.target.dataset.name??e.target.dataset.value;if(i===undefined)return;i=Number(i);if(e.target.dataset.name!==undefined)assets[i][0]=e.target.value;else assets[i][1]=Math.max(0,Number(e.target.value)||0);calc();save();});
$('assets').addEventListener('click',e=>{if(e.target.dataset.remove!==undefined){assets.splice(Number(e.target.dataset.remove),1);renderAssets();calc();save();}});
$('addAsset').onclick=()=>{assets.push(['기타 재산',0]);renderAssets();save();};
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('show',x.id===b.dataset.tab));calc();});
function calc(){
 const asset=assets.reduce((s,a)=>s+a[1],0);$('assetTotal').textContent=won(asset);
 const deemed=n('insurance')+n('retirement')+n('trust')+n('deemed');
 const gifts=n('giftHeir')+n('giftNonHeir')+n('giftSpecial');
 const gross=asset+deemed+gifts;
 const deductionsFromEstate=['exempt','excluded','publicCharges','funeral','debt','valuationFee'].reduce((s,id)=>s+n(id),0);
 const estate=Math.max(0,gross-deductionsFromEstate);
 $('estateDetails').innerHTML=[['본래 상속재산',asset],['간주·추정상속재산',deemed],['사전증여재산',gifts],['총 가산액',gross],['차감항목',-deductionsFromEstate]].map(([k,v])=>`<div class="row"><span>${k}</span><strong>${v<0?'− ':''}${won(Math.abs(v))}</strong></div>`).join('');
 $('estateValue').textContent=won(estate);
 const actual=n('basicDed')+n('personalDed'), choice=$('deductionChoice').value;
 const basic=choice==='lump'?500000000:choice==='actual'?actual:Math.max(500000000,actual);
 const baseDed=$('resident').value==='no'?200000000:basic;
 const spouse=$('resident').value==='yes'&&$('spouse').value==='yes'?n('spouseDed'):0;
 const other=n('financialDed')+n('businessDed')+n('farmDed')+n('homeDed')+n('otherDed');
 const raw=baseDed+spouse+other;
 const limit=$('deductionLimit').value===''?estate:n('deductionLimit');
 const totalDed=Math.min(raw,limit,estate), taxBase=Math.max(0,estate-totalDed);
 $('deductionTotal').textContent=won(totalDed);
 let rate=.1,progress=0;
 if(taxBase>3000000000){rate=.5;progress=460000000}
 else if(taxBase>1000000000){rate=.4;progress=160000000}
 else if(taxBase>500000000){rate=.3;progress=60000000}
 else if(taxBase>100000000){rate=.2;progress=10000000}
 const tax=Math.max(0,taxBase*rate-progress);
 $('taxBase').textContent=won(taxBase);$('taxRate').textContent=`${rate*100}% / ${won(progress)}`;$('calculatedTax').textContent=won(tax);
 const surcharge=n('generationSurcharge'), credits=n('giftTaxCredit')+n('shortReinheritCredit')+n('foreignTaxCredit')+n('otherCredit');
 const afterCredit=Math.max(0,tax+surcharge-credits);
 const filing=afterCredit*Math.min(100,n('filingRate'))/100;
 const final=Math.max(0,afterCredit-filing+n('penalty')-n('prepaid'));
 $('finalTax').textContent=won(final);
 $('resultDetails').innerHTML=[['상속세 과세가액',estate],['상속공제 입력액 반영 후 과세표준',taxBase],['산출세액',tax],['세대생략 할증세액',surcharge],['입력 세액공제 합계',-credits],['신고세액공제 단순 추정',-filing],['가산세',n('penalty')],['기납부세액',-n('prepaid')],['예상 납부세액',final]].map(([k,v])=>`<div class="row"><span>${k}</span><strong>${v<0?'− ':''}${won(Math.abs(v))}</strong></div>`).join('');
 const warnings=[];
 if(!$('date').value)warnings.push('상속개시일 미입력: 적용 법령 및 평가기준일을 확정할 수 없습니다.');
 if($('deductionLimit').value==='')warnings.push('상속공제 종합한도 미입력: 과세가액을 임시 한도로 사용했습니다.');
 if($('spouse').value==='yes'&&$('resident').value==='yes'&&n('spouseDed')===0)warnings.push('배우자상속공제 요건 및 실제 적용액을 검토하십시오.');
 if($('resident').value==='no')warnings.push('비거주자: 국내 소재 상속재산 및 공제범위를 별도 검토해야 합니다.');
 const unchecked=checklist.length-document.querySelectorAll('.ck:checked').length;if(unchecked)warnings.push(`재산조사 체크리스트 ${unchecked}개 항목 미확인`);
 if(n('funeral')>15000000)warnings.push('장례비용 공제한도·봉안시설 비용 및 증빙을 확인하십시오.');
 if(n('financialDed')>200000000)warnings.push('금융재산상속공제의 법정 한도 및 순금융재산 산식을 확인하십시오.');
 warnings.push('배우자공제·금융재산공제·가업/영농/동거주택공제 및 제24조 종합한도는 자동 법률판정하지 않습니다.');
 warnings.push('신고세액공제는 입력비율로 단순 추정한 값이며 실제 법정 계산과 다를 수 있습니다.');
 $('warnings').innerHTML=warnings.map(w=>`<div class="warning">• ${w}</div>`).join('');
}
function save(){try{const data={assets,fields:{},checks:[...document.querySelectorAll('.ck')].map(x=>x.checked)};document.querySelectorAll('input,select').forEach(x=>{if(!x.dataset.name&&!x.dataset.value&&!x.classList.contains('ck'))data.fields[x.id]=x.value});localStorage.setItem('inheritanceTaxPwa',JSON.stringify(data));}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem('inheritanceTaxPwa')||'null');if(!d)return;if(Array.isArray(d.assets))assets=d.assets;Object.entries(d.fields||{}).forEach(([id,v])=>{if($(id))$(id).value=v});(d.checks||[]).forEach((v,i)=>{const x=document.querySelector(`.ck[data-i="${i}"]`);if(x)x.checked=!!v});}catch(e){}}
document.addEventListener('input',e=>{if(e.target.matches('input,select')){calc();save();}});
document.addEventListener('change',e=>{if(e.target.matches('input,select')){calc();save();}});
$('print').onclick=()=>window.print();
$('export').onclick=()=>{const d=localStorage.getItem('inheritanceTaxPwa')||'{}';const blob=new Blob([d],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='상속세계산기_입력자료.json';a.click();URL.revokeObjectURL(a.href);};
$('reset').onclick=()=>{if(!confirm('모든 입력자료를 삭제할까요?'))return;localStorage.removeItem('inheritanceTaxPwa');location.reload();};
renderAssets();load();renderAssets();calc();
})();