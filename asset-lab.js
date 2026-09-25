(()=>{
  const q=window.__qiancheng;
  if(!q)return;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],st=q.state;
  const css=document.createElement('link');css.rel='stylesheet';css.href='asset-lab.css';document.head.appendChild(css);const observatoryCss=document.createElement('link');observatoryCss.rel='stylesheet';observatoryCss.href='capital-observatory.css';document.head.appendChild(observatoryCss);
  const money=n=>'¥'+Math.round(Math.max(0,n||0)).toLocaleString('zh-CN');
  const signedMoney=n=>`${n<0?'−':''}¥${Math.round(Math.abs(n||0)).toLocaleString('zh-CN')}`;
  const strategies={
    safety:{label:'安全优先',desc:'先把生活费变成安全垫',reserveMonths:6,reserveShare:.45,goalShare:.22,growthShare:.08,spendFactor:.94,shockFactor:.78},
    balanced:{label:'平衡成长',desc:'兼顾目标、流动性与成长',reserveMonths:4,reserveShare:.30,goalShare:.32,growthShare:.18,spendFactor:1,shockFactor:1},
    explore:{label:'目标加速',desc:'提高目标与探索预算',reserveMonths:3,reserveShare:.20,goalShare:.48,growthShare:.26,spendFactor:1.04,shockFactor:1.14}
  };
  q.allocationStrategies=strategies;
  function detect(text){
    if(/稳定|保守|安全垫|不想冒险|父母|照顾/.test(text))return'safety';
    if(/创业|投资|冒险|挑战|加速|自由职业/.test(text))return'explore';
    return'balanced';
  }
  function injectCapitalObservatory(){
    const proof=$('.proof');
    if(!proof||$('#capitalObservatory'))return;
    proof.insertAdjacentHTML('afterend',`<section class="capital-observatory" id="capitalObservatory" aria-labelledby="capitalObservatoryTitle">
      <div class="capital-head"><div><small>资金流向 · 实时联动</small><strong id="capitalObservatoryTitle">每月结余，如何成为未来缓冲</strong></div><span id="obsContext">等待模拟</span></div>
      <div class="capital-grid">
        <div class="capital-ring-wrap"><div class="capital-ring" id="capitalRing" role="img" aria-label="月度资金分配"><div class="capital-ring-core"><small>月度净结余</small><b id="obsSurplus">—</b><span id="obsMarginTag">等待计算</span></div></div><small class="capital-savings" id="obsSavings">当前存款 —</small></div>
        <div class="capital-breakdown" aria-label="月度结余分配">
          <div class="capital-split" data-split="reserve"><div><i></i><span>安全垫</span><b id="obsReserve">—</b><small id="obsReservePct">0%</small></div><span class="capital-split-track"><i id="obsReserveBar"></i></span></div>
          <div class="capital-split" data-split="goal"><div><i></i><span>近期目标</span><b id="obsGoal">—</b><small id="obsGoalPct">0%</small></div><span class="capital-split-track"><i id="obsGoalBar"></i></span></div>
          <div class="capital-split" data-split="growth"><div><i></i><span>成长预算</span><b id="obsGrowth">—</b><small id="obsGrowthPct">0%</small></div><span class="capital-split-track"><i id="obsGrowthBar"></i></span></div>
          <div class="capital-split" data-split="liquid"><div><i></i><span>机动余额</span><b id="obsLiquid">—</b><small id="obsLiquidPct">0%</small></div><span class="capital-split-track"><i id="obsLiquidBar"></i></span></div>
        </div>
      </div>
      <div class="capital-equation"><div><small>月度流入</small><b id="obsIncome">—</b></div><i>−</i><div><small>生活与住房</small><b id="obsCosts">—</b></div><i>=</i><div class="capital-net"><small>月度结余</small><b id="obsMargin">—</b></div></div>
      <div class="capital-target"><div class="capital-target-head"><div><small>下一笔人生目标</small><strong id="obsGoalLine">—</strong></div><div class="capital-target-budget"><b id="obsGoalBudget">—</b><small>目标预算</small></div></div><div class="capital-target-rail"><i id="obsTargetMarker"></i></div><div class="capital-target-foot"><span>现在</span><span id="obsTargetMonth">—</span><span id="obsHorizon">—</span><b id="obsGoalRates">— / —</b></div></div>
      <div class="capital-foot"><span id="obsStress">低分位安全线：—</span><span>本地规则情景模拟 · 非确定预测</span></div>
    </section>`);
  }
  function inject(){
    injectCapitalObservatory();
    if($('#allocationLab')||!$('#intentCard'))return;
    $('#intentCard').insertAdjacentHTML('afterend',`<section class="allocation-lab" id="allocationLab"><div class="lab-head"><div><span>CAPITAL MAP</span><b>资金配置实验室</b></div><small>不推荐具体产品，只展示资金用途、安全边界和选择后果</small></div><div class="strategy-options">${Object.entries(strategies).map(([k,v])=>`<button class="strategy-option" data-strategy="${k}"><strong>${v.label}</strong><span>${v.desc}</span></button>`).join('')}</div><div class="allocation-top"><div><small>当前比较基准</small><strong id="allocationRoute">—</strong></div><div><small>月度可分配余额</small><strong id="allocationSurplus">—</strong></div><div><small>期末可用资金</small><strong id="allocationAvailable">—</strong></div></div><div class="bucket-bar" id="bucketBar"></div><div class="bucket-legend"><span><i class="reserve"></i>安全垫</span><span><i class="goal"></i>近期目标</span><span><i class="growth"></i>成长预算</span><span><i class="liquid"></i>机动余额</span></div><div class="allocation-decision"><div class="decision-mark">↗</div><div><small>这一次改变了什么</small><strong id="allocationDecisionTitle">—</strong><p id="allocationDecisionText">选择策略后，这里会解释资金如何重新分层。</p></div><div class="decision-route"><small>优先路线</small><b id="allocationDecisionRoute">—</b></div></div><div class="allocation-grid"><div><small>安全垫目标</small><b id="allocReserve">—</b><span>按生活成本与策略月份计算</span></div><div><small>目标月投入</small><b id="allocGoal">—</b><span>旅行、电脑等目标优先</span></div><div><small>成长预算</small><b id="allocGrowth">—</b><span>可用于学习、项目或长期配置</span></div><div><small>压力测试</small><b id="allocStress">—</b><span>观察P10安全线是否跌破</span></div></div><div class="allocation-actions"><span id="allocationActionText">先选择一种策略，查看它如何改变资金分层。</span><button data-action="reserve">建立安全垫</button><button data-action="goal">拆解近期目标</button><button data-action="learn">了解成长工具</button></div></section>`);
    $$('[data-strategy]').forEach(b=>b.addEventListener('click',()=>{st.strategy=b.dataset.strategy;st.strategyManual=true;st.allocationActionManual=false;$$('[data-strategy]').forEach(x=>x.classList.toggle('active',x===b));if(q.enhancedRun)q.enhancedRun(true);refresh()}));
    $$('[data-action]').forEach(b=>b.addEventListener('click',()=>{const m={reserve:'已将“建立安全垫”设为下一步行动。',goal:'已将近期目标拆成月度投入，返回路线查看它的现金流影响。',learn:'已保留成长预算，下一步可进入金融知识服务了解不同工具。'};st.allocationActionManual=true;$('#allocationActionText').textContent=m[b.dataset.action];if(window.toast)toast('已更新下一步行动')}));
    $('#scenarioText').addEventListener('input',()=>{st.strategyManual=false;st.allocationActionManual=false;const next=detect($('#scenarioText').value);if(st.strategy!==next){st.strategy=next;setTimeout(()=>q.enhancedRun&&q.enhancedRun(false),280)}});
  }
  function routeMap(route,res,cfg){
    const baseIncome=+$('#baseIncome').value||0,baseExpense=+$('#baseExpense').value||0;
    const monthlyIncome=Math.max(baseIncome,route.salary||0),monthlyCost=baseExpense+(route.rent||0),margin=monthlyIncome-monthlyCost;
    const surplus=Math.max(0,margin),budget=Math.round(surplus),hasRouteGoal=Object.prototype.hasOwnProperty.call(route,'goalCost'),routeGoal=hasRouteGoal?(route.goalCost||0):0;
    const sharedGoals=route.includeSharedGoal?routeGoal+(st.goal||0):Math.max(routeGoal,st.goal||0),goalTotal=sharedGoals+(st.computer||0),savings=+$('#savings').value||0;
    const reserveGap=Math.max(0,monthlyCost*cfg.reserveMonths-savings),reserve=Math.min(budget,Math.round(Math.min(surplus*cfg.reserveShare,reserveGap)));
    const goalMonths=[hasRouteGoal&&routeGoal>0?route.goalMonth:Infinity,(st.goal||0)>0?(st.goalMonth||18):Infinity].filter(Number.isFinite),goalMonth=goalMonths.length?Math.max(1,Math.min(...goalMonths)):18,goalPace=goalTotal/goalMonth;
    const remainingAfterReserve=Math.max(0,budget-reserve),goal=Math.min(remainingAfterReserve,Math.round(Math.min(remainingAfterReserve*cfg.goalShare,goalPace))),growth=Math.min(Math.max(0,remainingAfterReserve-goal),Math.round(Math.max(0,remainingAfterReserve-goal)*cfg.growthShare));
    const liquid=Math.max(0,budget-reserve-goal-growth),end=res?.p50?.[st.months-1]||0,available=Math.max(0,end-monthlyCost*cfg.reserveMonths-goalTotal),basis=route.delay>6?'上岗后':'当前';
    return{city:route.city,surplus,reserve,goal,growth,liquid,available,basis,p10:res?.p10?.[st.months-1]||0,monthlyIncome,monthlyCost,margin};
  }
  function refreshCapitalObservatory(best,a,b,cfg){
    const panel=$('#capitalObservatory');
    if(!panel)return;
    const parts=[['reserve',best.reserve],['goal',best.goal],['growth',best.growth],['liquid',best.liquid]],total=parts.reduce((sum,[,value])=>sum+value,0),denominator=total||1;
    let cumulative=0;
    const stops={};
    parts.forEach(([key,value])=>{cumulative+=value/denominator*100;stops[key]=`${total?cumulative:0}%`;const share=total?Math.round(value/total*100):0;$('#obs'+key[0].toUpperCase()+key.slice(1)).textContent=money(value);$('#obs'+key[0].toUpperCase()+key.slice(1)+'Pct').textContent=`${share}%`;$('#obs'+key[0].toUpperCase()+key.slice(1)+'Bar').style.width=`${share}%`});
    const ring=$('#capitalRing');ring.style.setProperty('--stop-reserve',stops.reserve);ring.style.setProperty('--stop-goal',stops.goal);ring.style.setProperty('--stop-growth',stops.growth);ring.dataset.balance=best.margin<0?'deficit':best.margin===0?'flat':'positive';ring.style.background=total?'':best.margin<0?'conic-gradient(from -90deg,rgba(255,134,124,.78) 0 10%,rgba(255,255,255,.07) 10% 100%)':'conic-gradient(from -90deg,rgba(169,198,218,.34) 0 8%,rgba(255,255,255,.07) 8% 100%)';
    ring.setAttribute('aria-label',`月度可分配资金 ${signedMoney(best.margin)}；安全垫 ${money(best.reserve)}，近期目标 ${money(best.goal)}，成长预算 ${money(best.growth)}，机动余额 ${money(best.liquid)}`);
    $('#obsSurplus').textContent=signedMoney(best.margin);$('#obsMarginTag').textContent=best.margin<0?'本月存在资金缺口':best.margin===0?'收支持平':'进入策略分配';$('#obsSavings').textContent=`当前存款 ${money(+$('#savings').value||0)}`;
    $('#obsContext').textContent=`${best.city} · ${cfg.label}`;$('#obsIncome').textContent=money(best.monthlyIncome);$('#obsCosts').textContent=money(best.monthlyCost);$('#obsMargin').textContent=signedMoney(best.margin);$('#obsMargin').parentElement.dataset.balance=best.margin<0?'deficit':'positive';
    const goalMonth=Math.max(1,Math.min(st.months,+st.goalMonth||1)),goalName=st.goalLabel||'人生目标',hasGoal=+st.goal>0;
    $('#obsGoalLine').textContent=hasGoal?`${goalName} · 第${goalMonth}个月`:'尚未设定近期目标';$('#obsGoalBudget').textContent=hasGoal?money(st.goal):'—';$('#obsTargetMonth').textContent=hasGoal?`第${goalMonth}个月`:'未设定';$('#obsHorizon').textContent=`${st.months}个月`;
    $('#obsTargetMarker').style.left=`${hasGoal?Math.max(2,Math.min(98,goalMonth/st.months*100)):0}%`;$('#obsTargetMarker').parentElement.dataset.active=hasGoal?'true':'false';$('#obsGoalRates').textContent=hasGoal?`${Math.round(st.result.a.goal)}% / ${Math.round(st.result.b.goal)}%`:'— / —';
    $('#obsStress').dataset.risk=best.p10<0?'high':'buffer';$('#obsStress').textContent=best.p10<0?`P10 ${signedMoney(best.p10)} · 低分位跌破安全线`:`P10 ${signedMoney(best.p10)} · 低分位仍有缓冲`;
  }
  function refresh(){
    inject();
    if(!$('#allocationLab')||!st.result)return;
    if(!st.strategyManual)st.strategy=detect($('#scenarioText').value);
    const cfg=strategies[st.strategy]||strategies.balanced,a=routeMap(st.a,st.result.a,cfg),b=routeMap(st.b,st.result.b,cfg),best=st.result.a.p50[st.months-1]>=st.result.b.p50[st.months-1]?a:b,total=Math.max(1,best.surplus),bar=[['reserve',best.reserve],['goal',best.goal],['growth',best.growth],['liquid',best.liquid]];
    $$('[data-strategy]').forEach(x=>x.classList.toggle('active',x.dataset.strategy===st.strategy));
    $('#allocationRoute').textContent=`${best.city} · ${cfg.label}（${best.basis}）`;$('#allocationSurplus').textContent=money(best.surplus);$('#allocationAvailable').textContent=money(best.available);$('#allocReserve').textContent=money(best.reserve*12);$('#allocGoal').textContent=money(best.goal);$('#allocGrowth').textContent=money(best.growth);$('#allocStress').textContent=best.p10<0?'P10跌破安全线':'P10仍在安全线之上';
    const decision={safety:['优先保障安全边界','先覆盖生活成本，再把剩余资金分给目标与成长。'],balanced:['让目标与缓冲共存','在安全垫、近期目标和成长预算之间保留弹性。'],explore:['把更多资金给目标与成长','提高探索预算，同时把更高的波动暴露写进结果。']}[st.strategy]||['让目标与缓冲共存','在安全垫、近期目标和成长预算之间保留弹性。'];
    $('#allocationDecisionTitle').textContent=decision[0];$('#allocationDecisionRoute').textContent=best.city;$('#allocationDecisionText').textContent=`${decision[1]} 当前${best.p10<0?'P10已跌破安全线，先回看缓冲。':'P10仍在安全线之上，可继续比较目标优先级。'}`;
    if(!st.allocationActionManual)$('#allocationActionText').textContent=st.strategy==='safety'?'下一步：先确认安全垫能覆盖几个月生活成本。':st.strategy==='explore'?'下一步：把探索预算放回路线，观察最差情景。':'下一步：在安全垫与近期目标之间调整比例。';
    $('#bucketBar').innerHTML=bar.map(([k,v])=>`<i class="${k}" style="width:${Math.max(4,v/total*100)}%" title="${k} ${money(v)}"></i>`).join('');
    refreshCapitalObservatory(best,a,b,cfg);
  }
  const exportButton=$('#exportResult');
  if(exportButton)exportButton.onclick=()=>{const e=st.months-1,a=st.result?.a,b=st.result?.b;if(!a||!b)return;const label=st.goalLabel||'人生目标',t=`工E千程模拟摘要\n${st.a.city} P50：${money(a.p50[e])}\n${st.b.city} P50：${money(b.p50[e])}\n${label}达成率：${Math.round(a.goal)}% / ${Math.round(b.goal)}%\n本结果为情景模拟，不构成金融建议。`,blob=new Blob([t],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='工E千程-模拟摘要.txt';link.click();toast('模拟摘要已导出')};
  window.addEventListener('qiancheng:updated',refresh);setTimeout(()=>{if(!st.strategy)st.strategy=detect($('#scenarioText')?.value||'');refresh()},80);
})();
