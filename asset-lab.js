(()=>{
  const q=window.__qiancheng;
  if(!q)return;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],st=q.state;
  const css=document.createElement('link');css.rel='stylesheet';css.href='asset-lab.css';document.head.appendChild(css);
  const money=n=>'¥'+Math.round(Math.max(0,n||0)).toLocaleString('zh-CN');
  const strategies={
    safety:{label:'安全优先',desc:'先把生活费变成安全垫',reserveMonths:6,goalShare:.22,growthShare:.08,spendFactor:.94,shockFactor:.78},
    balanced:{label:'平衡成长',desc:'兼顾目标、流动性与成长',reserveMonths:4,goalShare:.32,growthShare:.18,spendFactor:1,shockFactor:1},
    explore:{label:'目标加速',desc:'提高目标与探索预算',reserveMonths:3,goalShare:.48,growthShare:.26,spendFactor:1.04,shockFactor:1.14}
  };
  q.allocationStrategies=strategies;
  function detect(text){
    if(/稳定|保守|安全垫|不想冒险|父母|照顾/.test(text))return'safety';
    if(/创业|投资|冒险|挑战|加速|自由职业/.test(text))return'explore';
    return'balanced';
  }
  function inject(){
    if($('#allocationLab')||!$('#intentCard'))return;
    $('#intentCard').insertAdjacentHTML('afterend',`<section class="allocation-lab" id="allocationLab"><div class="lab-head"><div><span>CAPITAL MAP</span><b>资金配置实验室</b></div><small>不推荐具体产品，只展示资金用途、安全边界和选择后果</small></div><div class="strategy-options">${Object.entries(strategies).map(([k,v])=>`<button class="strategy-option" data-strategy="${k}"><strong>${v.label}</strong><span>${v.desc}</span></button>`).join('')}</div><div class="allocation-top"><div><small>当前比较基准</small><strong id="allocationRoute">—</strong></div><div><small>月度可分配余额</small><strong id="allocationSurplus">—</strong></div><div><small>期末可用资金</small><strong id="allocationAvailable">—</strong></div></div><div class="bucket-bar" id="bucketBar"></div><div class="bucket-legend"><span><i class="reserve"></i>安全垫</span><span><i class="goal"></i>近期目标</span><span><i class="growth"></i>成长预算</span><span><i class="liquid"></i>机动余额</span></div><div class="allocation-grid"><div><small>安全垫目标</small><b id="allocReserve">—</b><span>按生活成本与策略月份计算</span></div><div><small>目标月投入</small><b id="allocGoal">—</b><span>旅行、电脑等目标优先</span></div><div><small>成长预算</small><b id="allocGrowth">—</b><span>可用于学习、项目或长期配置</span></div><div><small>压力测试</small><b id="allocStress">—</b><span>观察P10安全线是否跌破</span></div></div><div class="allocation-actions"><span id="allocationActionText">先选择一种策略，查看它如何改变资金分层。</span><button data-action="reserve">建立安全垫</button><button data-action="goal">拆解近期目标</button><button data-action="learn">了解成长工具</button></div></section>`);
    $$('[data-strategy]').forEach(b=>b.addEventListener('click',()=>{st.strategy=b.dataset.strategy;st.strategyManual=true;$$('[data-strategy]').forEach(x=>x.classList.toggle('active',x===b));if(q.enhancedRun)q.enhancedRun(true);refresh()}));
    $$('[data-action]').forEach(b=>b.addEventListener('click',()=>{const m={reserve:'已将“建立安全垫”设为下一步行动。',goal:'已将近期目标拆成月度投入，返回路线查看它的现金流影响。',learn:'已保留成长预算，下一步可进入金融知识服务了解不同工具。'};$('#allocationActionText').textContent=m[b.dataset.action];if(window.toast)toast('已更新下一步行动')}));
    $('#scenarioText').addEventListener('input',()=>{st.strategyManual=false;const next=detect($('#scenarioText').value);if(st.strategy!==next){st.strategy=next;setTimeout(()=>q.enhancedRun&&q.enhancedRun(false),280)}});
  }
  function routeMap(route,res,cfg){
    const baseIncome=+$('#baseIncome').value||0,baseExpense=+$('#baseExpense').value||0,monthlyIncome=route.delay>6?Math.max(baseIncome,route.salary||0):Math.max(baseIncome,route.salary||0),monthlyCost=baseExpense+(route.rent||0),surplus=Math.max(0,monthlyIncome-monthlyCost),reserve=Math.min(surplus*.55,monthlyCost*cfg.reserveMonths/12),routeGoal=Object.prototype.hasOwnProperty.call(route,'goalCost')?route.goalCost:st.goal,goalTotal=(routeGoal||0)+(st.computer||0),goalCap=routeGoal>0&&route.goalMonth===1?routeGoal*cfg.goalShare:goalTotal/18*cfg.goalShare,goal=Math.min(Math.max(0,surplus-reserve),goalCap),growth=Math.max(0,surplus-reserve-goal)*cfg.growthShare,liquid=Math.max(0,surplus-reserve-goal-growth),end=res?.p50?.[st.months-1]||0,available=Math.max(0,end-monthlyCost*cfg.reserveMonths-goalTotal),basis=route.delay>6?'上岗后':'当前';
    return{city:route.city,surplus,reserve,goal,growth,liquid,available,basis,p10:res?.p10?.[st.months-1]||0};
  }
  function refresh(){
    inject();
    if(!$('#allocationLab')||!st.result)return;
    if(!st.strategyManual)st.strategy=detect($('#scenarioText').value);
    const cfg=strategies[st.strategy]||strategies.balanced,a=routeMap(st.a,st.result.a,cfg),b=routeMap(st.b,st.result.b,cfg),best=st.result.a.p50[st.months-1]>=st.result.b.p50[st.months-1]?a:b,total=Math.max(1,best.surplus),bar=[['reserve',best.reserve],['goal',best.goal],['growth',best.growth],['liquid',best.liquid]];
    $$('[data-strategy]').forEach(x=>x.classList.toggle('active',x.dataset.strategy===st.strategy));
    $('#allocationRoute').textContent=`${best.city} · ${cfg.label}（${best.basis}）`;$('#allocationSurplus').textContent=money(best.surplus);$('#allocationAvailable').textContent=money(best.available);$('#allocReserve').textContent=money(best.reserve*12);$('#allocGoal').textContent=money(best.goal);$('#allocGrowth').textContent=money(best.growth);$('#allocStress').textContent=best.p10<0?'P10跌破安全线':'P10仍在安全线之上';
    $('#bucketBar').innerHTML=bar.map(([k,v])=>`<i class="${k}" style="width:${Math.max(4,v/total*100)}%" title="${k} ${money(v)}"></i>`).join('');
  }
  const exportButton=$('#exportResult');
  if(exportButton)exportButton.onclick=()=>{const e=st.months-1,a=st.result?.a,b=st.result?.b;if(!a||!b)return;const label=st.goalLabel||'人生目标',t=`工E千程模拟摘要\n${st.a.city} P50：${money(a.p50[e])}\n${st.b.city} P50：${money(b.p50[e])}\n${label}达成率：${Math.round(a.goal)}% / ${Math.round(b.goal)}%\n本结果为情景模拟，不构成金融建议。`,blob=new Blob([t],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='工E千程-模拟摘要.txt';link.click();toast('模拟摘要已导出')};
  window.addEventListener('qiancheng:updated',refresh);setTimeout(()=>{if(!st.strategy)st.strategy=detect($('#scenarioText')?.value||'');refresh()},80);
})();
