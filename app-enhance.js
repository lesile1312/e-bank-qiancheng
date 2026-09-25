(()=>{
  const q=window.__qiancheng;
  if(!q)return;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],st=q.state;
  const favicon=document.createElement('link');favicon.rel='icon';favicon.type='image/svg+xml';favicon.href='favicon.svg';document.head.appendChild(favicon);
  const presets={
    campus:{label:'校园生活',goalLabel:'日本旅行',goal:12000,goalMonth:6,hint:'比较先买电脑与延后购置，对旅行目标和现金安全的影响',prompt:'我是在校大学生，每月生活费3200元，日常开销2430元，现有存款12580元。想在第6个月去日本旅行，预算12000元；电脑预算9000元，现在买或第9个月再买。比较两种安排能否兼顾旅行目标与现金安全。',a:{city:'现在购置电脑',salary:0,rent:0,delay:60,preIncome:3200,volatility:.035,goalLabel:'电脑购置',goalMonth:1,goalCost:9000,includeSharedGoal:true},b:{city:'第9个月再购置',salary:0,rent:0,delay:60,preIncome:3200,volatility:.035,goalLabel:'电脑购置',goalMonth:9,goalCost:9000,includeSharedGoal:true}},
    career:{label:'城市就业',goalLabel:'日本旅行',goal:12000,goalMonth:18,hint:'比较收入、房租与目标支出的长期现金流',prompt:'毕业后去深圳月薪12000，还是留昆明月薪7000？深圳房租2800，我明年想去日本旅行，预算12000元。',a:{city:'深圳',salary:12000,rent:2800,delay:6,volatility:.14},b:{city:'昆明',salary:7000,rent:1800,delay:6,volatility:.14}},
    education:{label:'考研深造',goalLabel:'考研投入',goal:18000,goalMonth:1,hint:'把学习投入、延迟就业和毕业后的成长放进同一张路线图',prompt:'我想考研两年，前期接受收入下降，但希望毕业后有更好的发展，预算18000元。',a:{city:'本地就业',salary:5200,rent:1200,delay:6,goalLabel:'考研投入',goalMonth:1,goalCost:0,volatility:.12},b:{city:'继续深造',salary:12500,rent:1500,delay:18,preIncome:700,study:true,goalLabel:'考研投入',goalMonth:1,goalCost:18000,volatility:.18}},
    entrepreneur:{label:'创业试水',goalLabel:'创业启动投入',goal:25000,goalMonth:1,hint:'比较稳定就业与低成本创业，先看现金缓冲能否撑住试错',prompt:'我想创业试水，前期投入25000元，希望保留就业保底并观察五年现金流。',a:{city:'稳定就业',salary:10500,rent:2200,delay:6,goalLabel:'创业启动投入',goalMonth:1,goalCost:0,volatility:.13},b:{city:'创业试水',salary:8500,rent:1900,delay:6,goalLabel:'创业启动投入',goalMonth:1,goalCost:25000,incomeFloor:2500,volatility:.30,riskPremium:.004}},
    freelance:{label:'自由职业',goalLabel:'弹性安全垫',goal:0,goalMonth:1,hint:'比较稳定工作与远程接单，关注弹性、波动和最低现金安全线',prompt:'我更想做自由职业，收入可以波动，但希望保留生活弹性和至少一年的安全垫。',a:{city:'稳定就业',salary:9800,rent:2300,delay:6,volatility:.12},b:{city:'远程自由职业',salary:9000,rent:1500,delay:6,incomeFloor:5200,volatility:.24,riskPremium:.002}},
    family:{label:'回家发展',goalLabel:'家庭责任预算',goal:0,goalMonth:1,hint:'把家庭支持、生活成本和职业机会放在同一个可解释比较里',prompt:'我想回家乡发展，照顾父母，同时比较大城市机会与家庭支持对未来资金的影响。',a:{city:'深圳机会',salary:12000,rent:2800,delay:6,volatility:.15},b:{city:'家乡发展',salary:6500,rent:1000,delay:6,familySupport:6000,monthlySupport:500,volatility:.12}}
  };
  let direction='campus';
  const clone=x=>({...x});
  const money=n=>'¥'+Math.round(n).toLocaleString('zh-CN');
  function guessDirection(text){if(/考研|深造|读研|学历|留学/.test(text))return'education';if(/在校|校园|大学生|生活费/.test(text))return'campus';if(/创业|开店|试水|项目/.test(text))return'entrepreneur';if(/自由职业|远程|接单|弹性/.test(text))return'freelance';if(/回家|家乡|父母|照顾/.test(text))return'family';return null}
  function customAmount(text){const m=(text||'').replace(/,/g,'').match(/(?:预算|投入|成本|金额|学费|目标)[^\d]{0,8}(\d{3,})/);return m?+m[1]:0}
  function intent(text){
    const t=text||'';
    const goals=[];
    if(/在校|校园|大学生|生活费/.test(t))goals.push('校园消费与储蓄平衡');
    if(/考研|深造|读研|学习|学历/.test(t))goals.push('成长与学习');
    if(/创业|开店|试水|项目/.test(t))goals.push('自主发展');
    if(/自由职业|远程|接单|弹性/.test(t))goals.push('时间弹性');
    if(/回家|家乡|父母|照顾/.test(t))goals.push('家庭责任');
    if(/高薪|收入|发展|机会|深圳|大城市/.test(t))goals.push('收入成长');
    if(!goals.length)goals.push(presets[direction].label);
    const constraints=[];
    if(/旅行|旅游|预算/.test(t))constraints.push('阶段性目标');
    if(/电脑|笔记本/.test(t))constraints.push('大额购置');
    if(/失业|待业|找工作|安全垫|缓冲/.test(t))constraints.push('现金安全垫');
    if(/父母|照顾/.test(t))constraints.push('家庭支持');
    if(/投入|成本|预算|学费/.test(t))constraints.push('前置投入');
    const risk=/稳定|保守|不想冒险|安全/.test(t)?'偏稳健':/冒险|创业|挑战|波动/.test(t)?'可承受波动':'中等风险承受';
    const summary=`你当前更关注「${goals.slice(0,2).join(' + ')}」，${constraints.length?`同时受「${constraints.slice(0,2).join('、')}」约束。`:''}系统将按${risk}生成两条可解释路线；金额由模拟引擎计算，画像只用于组织比较，不替你做决定。`;
    return{goals,constraints,risk,summary};
  }
  function renderIntent(){
    const x=intent($('#scenarioText').value),tags=[...x.goals,...x.constraints, x.risk];
    const tag=$('#intentTags');if(tag)tag.innerHTML=tags.map(v=>`<span>${v}</span>`).join('');
    const copy=$('#intentText');if(copy)copy.textContent=x.summary;
    const badge=$('#directionHint');if(badge)badge.textContent=presets[direction].hint;
    const title=$('#directionTitle');if(title)title.textContent=presets[direction].label;
  }
  function setLabels(){
    const p=presets[direction],a=st.a,b=st.b;
    $('#cityAName').textContent=a.city;$('#cityBName').textContent=b.city;
    $('#cityASalary').textContent=direction==='campus'?`每月生活费 ${money(+$('#baseIncome').value||0)} · 电脑第${a.goalMonth}月购置`:a.delay>6?`第${a.delay}月后 · 月薪 ${money(a.salary)}`:`月薪 ${money(a.salary)}`;
    $('#cityBSalary').textContent=direction==='campus'?`每月生活费 ${money(+$('#baseIncome').value||0)} · 电脑第${b.goalMonth}月购置`:b.delay>6?`第${b.delay}月后 · 月薪 ${money(b.salary)}`:`月薪 ${money(b.salary)}`;
    const la=$('.legend .a'),lb=$('.legend .b');if(la&&la.nextSibling)la.nextSibling.textContent=a.city+' ';if(lb&&lb.nextSibling)lb.nextSibling.textContent=b.city+' ';
    const fa=$('[data-focus="a"]'),fb=$('[data-focus="b"]');if(fa)fa.textContent=a.city+'路线';if(fb)fb.textContent=b.city+'路线';
    const title=$('.journey .title h2');if(title)title.innerHTML=`${p.label}，<br>不止一条曲线。`;
    const sub=$('.journey .title>p');if(sub)sub.textContent='点击节点查看资金中位数、事件和风险来源。切换方向或修改条件后，整条路线会重新计算。';
    const summary=$$('.summary>div span');if(summary[0])summary[0].textContent=direction==='campus'?`${a.city} · 目标前可用现金`:a.city+'资金中位数';if(summary[1])summary[1].textContent=direction==='campus'?`${b.city} · 目标前可用现金`:b.city+'资金中位数';
    const goalTitle=$('.goal b');if(goalTitle)goalTitle.textContent=st.goalLabel||'人生目标';const goalSmall=$('.goal small');if(goalSmall)goalSmall.textContent=st.goal?( `第${st.goalMonth||18}月 · ${money(st.goal)}`):'按当前方向计算';const goalSummary=$('.summary>div:nth-child(3) small');if(goalSummary)goalSummary.textContent=st.goal?`${st.goalLabel||'人生目标'} · 第${st.goalMonth||18}月`:'按方向策略计算';
    const incomeLabel=$$('.fields label').find(x=>x.querySelector('#baseIncome'));if(incomeLabel)incomeLabel.firstChild.textContent=direction==='campus'?'每月生活费':'每月收入';
    const spendLabel=$$('.fields label').find(x=>x.querySelector('#baseExpense'));if(spendLabel)spendLabel.firstChild.textContent=direction==='campus'?'每月日常开销':'基础生活支出';
    const horizon=+$('#horizon').value,period=$('.core-face span');if(period)period.textContent=`P50 · ${horizon} MONTHS`;
  }
  function enhancedSim(route){
    const months=+$('#horizon').value,g=+$('#salaryGrowth').value/100,eg=+$('#expenseGrowth').value/100,risk=+$('#shockLevel').value,start=+$('#savings').value||0,baseIncome=+$('#baseIncome').value||0,expense=+$('#baseExpense').value||0,paths=[],hits=[],policy=(q.allocationStrategies&&q.allocationStrategies[st.strategy])||{spendFactor:1,shockFactor:1};
    for(let r=0;r<1000;r++){
      let cash=start,series=[],hit=false;
      for(let m=1;m<=months;m++){
        const employed=m>route.delay;
        let income=employed?Math.max(route.incomeFloor||0,route.salary):route.preIncome!==undefined?route.preIncome:baseIncome;
        if(route.study&&!employed)income=Math.max(0,baseIncome*.35+route.preIncome||0);
      const vol=route.volatility||.14;
        income*=Math.pow(1+g,Math.max(0,m-route.delay)/12)*(1+(q.state.result&&q.state.result._seed?0:Math.sin(r*191+m)*vol*.5));
        if(st.unemployed&&m>=24&&m<30&&Math.sin(r*37+m)>.04)income*=.12;
        const housing=route.rent*(employed?1:(route.study?.72:1)),extra=route.monthlyExtra||0;
        let spend=(expense+housing+extra)*policy.spendFactor*Math.pow(1+eg,m/12)*(1+Math.sin(r*97+m)*.09);
        const shock=Math.sin(r*131+m)>(.988-risk*.006-(route.riskPremium||0))?(1200+Math.abs(Math.sin(r*71+m))*risk*900)*policy.shockFactor:0;
        const hasRouteGoal=Object.prototype.hasOwnProperty.call(route,'goalCost'),routeGoal=hasRouteGoal&&m===(route.goalMonth||1)?(route.goalCost||0):0,sharedGoal=(!hasRouteGoal||route.includeSharedGoal)&&m===(st.goalMonth||18)?st.goal:0,goals=routeGoal+sharedGoal+(m===12?st.computer:0)+(m===1?(route.oneOff||0):0);
        const support=(m===1?(route.familySupport||0):0)+(route.monthlySupport||0);
        const cashBeforeGoals=cash+income-spend-shock+support;
        if(m===(st.goalMonth||18)&&cashBeforeGoals>=(st.goal||0))hit=true;
        cash=cashBeforeGoals-goals; series.push(cash);
      }
      paths.push(series);hits.push(hit);
    }
    const p10=[],p50=[],p90=[];for(let m=0;m<months;m++){const v=paths.map(p=>p[m]).sort((a,b)=>a-b);p10.push(v[99]);p50.push(v[499]);p90.push(v[899])}
    return{p10,p50,p90,goal:hits.filter(Boolean).length/10,negative:paths.filter(p=>p.some(v=>v<0)).length};
  }
  function updateInsight(){
    const a=st.result.a,b=st.result.b,e=st.months-1,x=intent($('#scenarioText').value),campusPoint=Math.max(0,Math.min(e,(st.goalMonth||1)-2)),valueA=direction==='campus'?a.p50[campusPoint]:a.p50[e],valueB=direction==='campus'?b.p50[campusPoint]:b.p50[e],best=valueA>=valueB?st.a:st.b,diff=Math.abs(valueA-valueB);
    $('#insightText').textContent=direction==='campus'?`需求画像识别到「${x.goals.slice(0,2).join(' + ')}」与「${x.constraints.slice(0,2).join('、')}」。第${st.goalMonth}月旅行前，${best.city}路线的可用资金中位数高 ${money(diff)}；目标达成率为 ${Math.round(a.goal)}% / ${Math.round(b.goal)}%。差异主要来自电脑支出时点。`:`需求画像显示：${x.goals.slice(0,2).join(' + ')}，${x.risk}。在${presets[direction].label}下，${best.city}路线的期末资金中位数更高 ${money(diff)}；这只是情景推演，不代表确定结果，建议同时看P10安全线。`;
    const routeGoal=Math.max(st.a.goalCost||0,st.b.goalCost||0,st.goal||0);$('#factorList').innerHTML=`<div class="factor"><span>方向画像</span><b>${presets[direction].label} · ${x.risk}</b></div><div class="factor"><span>路线A / B</span><b>${st.a.city} / ${st.b.city}</b></div><div class="factor"><span>${st.goalLabel||'方向目标'}</span><b>${money(routeGoal)} · 第${st.goalMonth||18}月</b></div><div class="factor"><span>负现金流路径</span><b>${a.negative} / 1,000</b></div>`;
  }
  function enhancedRun(show){
    const before={goal:st.goal,computer:st.computer,unemployed:st.unemployed},amount=customAmount($('#scenarioText').value);
    q.parse();st.months=+$('#horizon').value;
    if(direction==='campus'){
      const p=presets.campus,text=$('#scenarioText').value.replace(/,/g,''),purchaseMatch=text.match(/(?:电脑|笔记本)[^\d]{0,15}(\d{4,})/),purchase=purchaseMatch?+purchaseMatch[1]:0,trip=text.match(/(?:日本旅行|日本旅游|旅行|旅游)[^\d]{0,36}(\d{4,})/),tripAmount=trip?+trip[1]:customAmount(text)||p.goal,goalMonthMatch=text.match(/第(\d{1,2})个月[^。？！]{0,15}(?:日本)?(?:旅行|旅游)/)||text.match(/(?:日本)?(?:旅行|旅游)[^。？！]{0,15}第(\d{1,2})个月/),purchaseMonthMatch=text.match(/第(\d{1,2})个月(?:后再|再)?(?:购置|买|购买)/),purchaseMonth=purchaseMonthMatch?Math.max(1,Math.min(st.months,+purchaseMonthMatch[1])):p.b.goalMonth;
      st.computer=0;st.goalLabel='日本旅行';st.goal=tripAmount;st.goalMonth=goalMonthMatch?Math.max(1,Math.min(st.months,+goalMonthMatch[1])):p.goalMonth;
      st.a={...clone(p.a),preIncome:+$('#baseIncome').value||0,goalCost:purchase,goalMonth:1};
      st.b={...clone(p.b),preIncome:+$('#baseIncome').value||0,goalCost:purchase,goalMonth:purchaseMonth};
      if(+$('#horizon').value<st.goalMonth)st.goalMonth=+$('#horizon').value;
    }
    else if(direction==='career'){const pa=presets.career.a,pb=presets.career.b;st.goalLabel=presets.career.goalLabel;st.goal=amount&&/旅行|旅游|目标/.test($('#scenarioText').value)?amount:presets.career.goal;st.goalMonth=presets.career.goalMonth;st.a={...clone(pa),salary:st.a.salary||pa.salary,rent:st.a.rent||pa.rent};st.b={...clone(pb),salary:st.b.salary||pb.salary,rent:st.b.rent||pb.rent}}
    else{const p=presets[direction];st.goalLabel=p.goalLabel;st.goal=amount||p.goal;st.goalMonth=p.goalMonth;st.a=clone(p.a);st.b=clone(p.b);if(direction==='education'||direction==='entrepreneur'){st.a.goalCost=0;st.b.goalCost=amount||p.goal}}
    st.result={a:enhancedSim(st.a),b:enhancedSim(st.b)};setLabels();q.timeline();q.chart();q.insight();setLabels();if(direction==='campus'){const checkpoint=Math.max(0,Math.min(st.months-1,(st.goalMonth||1)-2));[['a','#routeAP50','#routeARange'],['b','#routeBP50','#routeBRange']].forEach(([k,valueId,rangeId])=>{const res=st.result[k];$(valueId).textContent=money(res.p50[checkpoint]);$(rangeId).textContent=`${money(res.p10[checkpoint])} — ${money(res.p90[checkpoint])}`})}updateInsight();renderIntent();window.dispatchEvent(new Event('qiancheng:updated'));
    $$('.node').forEach(n=>{const route=n.closest('.route')?.dataset.route,r=route&&st[route];if(r&&r.delay>6&&n.querySelector('span')?.textContent==='进入职场')n.querySelector('span').textContent=`第${r.delay}月上岗`});
    if(show&&window.toast)toast('已按当前方向重新生成 1,000 条路径');
  }
  function inject(){
    const chips=$('.chips');
    if(chips&&!$('#directionBar')){
      chips.insertAdjacentHTML('afterend',`<div class="direction-bar" id="directionBar"><div class="direction-copy"><small>选择人生方向</small><strong id="directionTitle">校园生活</strong><span id="directionHint"></span></div><div class="direction-options">${Object.entries(presets).map(([k,v])=>`<button data-direction="${k}" class="${k===direction?'active':''}">${v.label}</button>`).join('')}</div></div><div class="intent-card" id="intentCard"><div class="intent-head"><span>SMART PROFILE</span><b>智能需求画像</b><em>本地规则解析</em></div><div id="intentTags"></div><p id="intentText"></p></div>`);
      $$('[data-direction]').forEach(btn=>btn.addEventListener('click',()=>{direction=btn.dataset.direction;$$('[data-direction]').forEach(x=>x.classList.toggle('active',x===btn));const p=presets[direction];$('#scenarioText').value=p.prompt;st.direction=direction;st.strategy=null;st.strategyManual=false;st.goalLabel=p.goalLabel;st.goal=p.goal;st.goalMonth=p.goalMonth;enhancedRun(true);$('#journey').scrollIntoView({behavior:'smooth',block:'start'})}));
      $('#scenarioText').addEventListener('input',()=>{const inferred=guessDirection($('#scenarioText').value);if(inferred&&inferred!==direction){direction=inferred;$$('[data-direction]').forEach(x=>x.classList.toggle('active',x.dataset.direction===direction));const p=presets[direction];st.direction=direction;st.strategy=null;st.strategyManual=false;st.goalLabel=p.goalLabel;st.goal=p.goal;st.goalMonth=p.goalMonth}renderIntent();clearTimeout(window.__intentTimer);window.__intentTimer=setTimeout(()=>enhancedRun(false),260)});
      $('#runSimulation').addEventListener('click',()=>setTimeout(()=>enhancedRun(false),0));
      ['savings','baseIncome','baseExpense','horizon','salaryGrowth','expenseGrowth','shockLevel'].forEach(id=>{const el=$('#'+id);if(el)el.addEventListener('change',()=>setTimeout(()=>enhancedRun(false),0))});
    }
    renderIntent();
  }
  function applyObservatoryDesign(){
    const link=document.createElement('link');link.rel='stylesheet';link.href='brand-overhaul.css';document.head.appendChild(link);
    document.body.classList.add('observatory-design');
    const h=$('.intro h1');if(h)h.innerHTML='今天花掉这笔钱，<br><em>明年还够去旅行吗？</em>';
    const intro=$('.intro>p:not(.eyebrow)');if(intro)intro.textContent='生活费、电脑、旅行与应急储备同时摆在面前。先把选择放进未来现金流，再决定怎样安排。';
    const eyebrow=$('.intro .eyebrow');if(eyebrow)eyebrow.innerHTML='<i></i>第十七届工行杯 · 青年未来财务实验室';
    const live=$('.live-note');if(live){live.lastChild.textContent='真实可交互网页原型 · 无需登录';live.insertAdjacentHTML('afterend','<a class="hero-explore" href="#command">进入校园情景模拟 <span>↓</span></a>')}
    const command=$('.command');if(command){command.id='command';const title=command.querySelector('.head strong');if(title)title.textContent='说出你的选择';const status=command.querySelector('.head>span');if(status)status.textContent='本地规则模拟 · 1,000条路径';const area=$('#scenarioText');if(area)area.value=presets.campus.prompt}
    const horizon=$('#horizon');if(horizon){horizon.value='36';horizon.dispatchEvent(new Event('change',{bubbles:true}))}
    const runButton=$('#runSimulation');if(runButton)runButton.textContent='生成我的现金流路径';
    const chips=$('.chips');if(chips){const b=chips.querySelectorAll('button');if(b[0])b[0].textContent='+ 电脑购置';if(b[1])b[1].textContent='+ 旅行预算';if(b[2])b[2].textContent='+ 应急缓冲'}
    const nav=$('.nav nav');if(nav){const names=['立即模拟','未来路线','调研证据','可信边界'];[...nav.children].forEach((a,i)=>{if(names[i])a.textContent=names[i]});if(!$('.nav-visit'))nav.insertAdjacentHTML('afterend','<a class="nav-visit" href="https://lesile1312.github.io/e-bank-qiancheng/" target="_blank" rel="noopener">线上参考版 <span>↗</span></a>')}
    const bar=$('.proof');if(bar){const items=bar.querySelectorAll('span');if(items[0])items[0].innerHTML='<b>1,000</b> 条情景路径';if(items[1])items[1].innerHTML='<b>36–60</b> 个月';if(items[2])items[2].innerHTML='<b>N=70</b> 探索样本'}
    const evidenceText=$('#evidence .title>p');if(evidenceText)evidenceText.textContent='高校 N=70 小样本探索性调研，仍在持续进行；样本范围有限，不代表全国大学生总体。';
    const footer=$('footer .shell');if(footer&&!$('.footer-visit'))footer.insertAdjacentHTML('beforeend','<a class="footer-visit" href="https://lesile1312.github.io/e-bank-qiancheng/" target="_blank" rel="noopener">打开线上参考版 <span>↗</span></a>');
  }
  applyObservatoryDesign();
  inject();
  document.body.classList.add('presentation-ready');
  const prepareReveal=()=>{const items=$$('.journey-board,.details .card,.evidence .stats article,.trust-grid article');if(!items.length)return;items.forEach(x=>x.classList.add('reveal-item'));if(!('IntersectionObserver' in window)){items.forEach(x=>x.classList.add('reveal-in'));return}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-in');observer.unobserve(entry.target)}}),{threshold:.12});items.forEach(x=>observer.observe(x))};
  q.enhancedRun=enhancedRun;
  const lab=document.createElement('script');lab.src='asset-lab.js';document.body.appendChild(lab);
  const premium=document.createElement('script');premium.src='premium-motion.js';document.body.appendChild(premium);
  setTimeout(()=>{enhancedRun(false);prepareReveal()},40);
})();
