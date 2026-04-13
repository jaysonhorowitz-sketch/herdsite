// Shared newsletter data — imported by both the issue detail page and /actions/newsletters

export function pick(arr, n) {
  const copy = [...arr]
  const out  = []
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

export const NL_MAINSTREAM = {
  "Executive Power": [
    { name: "Politico Playbook",          description: "The essential morning read for Washington insiders and policy watchers.",              url: "https://www.politico.com/newsletter/playbook" },
    { name: "Axios AM",                   description: "Smart brevity on the biggest political stories of the day.",                           url: "https://www.axios.com/newsletters/axios-am" },
    { name: "The Hill Morning Report",    description: "Daily digest of the top stories from Capitol Hill and the White House.",               url: "https://thehill.com/newsletter" },
    { name: "Washington Post The 6",      description: "Six essential political stories every morning from the Post's newsroom.",               url: "https://www.washingtonpost.com" },
  ],
  "Rule of Law": [
    { name: "SCOTUSblog",                 description: "Plain-language coverage of the Supreme Court and federal courts.",                     url: "https://www.scotusblog.com" },
    { name: "Just Security",              description: "Analysis of law and policy at the intersection of national security and rights.",       url: "https://www.justsecurity.org" },
    { name: "Law360",                     description: "Breaking legal news and analysis across every major practice area.",                    url: "https://www.law360.com" },
    { name: "Above the Law",              description: "News and commentary on the legal industry, courts, and legal policy.",                  url: "https://abovethelaw.com" },
  ],
  "Economy": [
    { name: "WSJ The 10-Point",           description: "Ten must-read stories each morning from the Wall Street Journal.",                     url: "https://www.wsj.com" },
    { name: "Axios Markets",              description: "Data-driven daily briefing on markets, business, and economic policy.",                 url: "https://www.axios.com/newsletters/axios-markets" },
    { name: "Bloomberg Evening Briefing", description: "The day's biggest economic and financial stories, distilled.",                          url: "https://www.bloomberg.com" },
    { name: "FT FirstFT",                 description: "Financial Times' morning digest of global economic news.",                              url: "https://www.ft.com" },
  ],
  "Civil Rights": [
    { name: "The 19th",                   description: "Nonprofit newsroom covering gender, politics, and policy.",                             url: "https://19thnews.org" },
    { name: "The Appeal",                 description: "Reporting on criminal legal reform and civil rights enforcement.",                      url: "https://theappeal.org" },
    { name: "ACLU Newsletter",            description: "Updates on civil liberties cases, legislation, and actions from the ACLU.",             url: "https://www.aclu.org/news" },
    { name: "ProPublica",                 description: "Investigative journalism on civil rights, inequality, and accountability.",              url: "https://www.propublica.org" },
  ],
  "National Security": [
    { name: "Defense One",                description: "Essential coverage of U.S. defense policy, the military, and global security.",         url: "https://www.defenseone.com" },
    { name: "War on the Rocks",           description: "Analysis of national security, defense strategy, and foreign policy.",                  url: "https://warontherocks.com" },
    { name: "Lawfare",                    description: "Rigorous legal and policy analysis on national security issues.",                       url: "https://www.lawfaremedia.org" },
    { name: "Foreign Policy",             description: "Global affairs reporting and analysis from Washington and abroad.",                     url: "https://foreignpolicy.com" },
  ],
  "Healthcare": [
    { name: "STAT News",                  description: "Authoritative journalism on health, medicine, and the life sciences.",                  url: "https://www.statnews.com" },
    { name: "Kaiser Health News",         description: "Nonprofit newsroom covering health policy, insurance, and public health.",               url: "https://kff.org/health-news" },
    { name: "Axios Vitals",               description: "Daily briefing on the health care industry and health policy.",                         url: "https://www.axios.com" },
    { name: "Modern Healthcare",          description: "Business and policy news for health care executives and policymakers.",                  url: "https://www.modernhealthcare.com" },
  ],
  "Environment": [
    { name: "NYT Climate Forward",        description: "The New York Times' guide to the latest on climate change and policy.",                 url: "https://www.nytimes.com/newsletters/climate-change" },
    { name: "Inside Climate News",        description: "Award-winning nonprofit journalism on climate and the environment.",                    url: "https://insideclimatenews.org" },
    { name: "E&E News",                   description: "Definitive source for energy and environment policy coverage in Washington.",           url: "https://www.eenews.net" },
    { name: "Yale Environment 360",       description: "Opinion, analysis, and reporting on the environment from Yale.",                        url: "https://e360.yale.edu" },
  ],
  "Education & Science": [
    { name: "Chronicle of Higher Education", description: "News and analysis on colleges, universities, and higher ed policy.",                url: "https://www.chronicle.com" },
    { name: "Science News",               description: "Accessible coverage of scientific research, discoveries, and funding.",                 url: "https://www.sciencenews.org" },
    { name: "Inside Higher Ed",           description: "Daily news on higher education policy, faculty, and campus life.",                      url: "https://www.insidehighered.com" },
    { name: "Nature News",                description: "Research news and policy analysis from one of science's top journals.",                  url: "https://www.nature.com/news" },
  ],
  "Immigration": [
    { name: "The Marshall Project",       description: "Nonpartisan journalism covering immigration enforcement and policy.",                   url: "https://www.themarshallproject.org" },
    { name: "Immigration Impact",         description: "News and analysis from the American Immigration Council.",                              url: "https://immigrationimpact.com" },
    { name: "Documented",                 description: "Journalism for and about immigrants navigating U.S. policy.",                           url: "https://documentedny.com" },
    { name: "Border Report",              description: "On-the-ground coverage of the U.S.–Mexico border and immigration.",                    url: "https://www.bordereport.com" },
  ],
  "Media & Democracy": [
    { name: "Columbia Journalism Review", description: "Critical analysis of the press, media ethics, and journalism's future.",                url: "https://www.cjr.org" },
    { name: "Nieman Lab",                 description: "Researching the future of journalism at Harvard's Nieman Foundation.",                  url: "https://www.niemanlab.org" },
    { name: "Press Gazette",              description: "News about the news industry, media trends, and press freedom.",                        url: "https://pressgazette.co.uk" },
    { name: "Poynter",                    description: "Journalism ethics, fact-checking, and media industry news.",                            url: "https://www.poynter.org" },
  ],
}

export const NL_SUBSTACK = {
  "Executive Power": [
    { name: "Popular Information",        description: "Judd Legum's accountability journalism on corporate and political power.",              url: "https://popular.info" },
    { name: "Letters from an American",   description: "Heather Cox Richardson's daily historical context on American politics.",              url: "https://heathercoxrichardson.substack.com" },
    { name: "Robert Reich",               description: "Former Labor Secretary Robert Reich on democracy, inequality, and power.",             url: "https://robertreich.substack.com" },
    { name: "The Bulwark",                description: "Center-right commentary on democracy, accountability, and the GOP.",                   url: "https://www.thebulwark.com" },
    { name: "HEATED",                     description: "Emily Atkin on how the powerful shape politics and policy.",                           url: "https://heatedblog.substack.com" },
  ],
  "Rule of Law": [
    { name: "Lawfare",                    description: "Deep legal analysis of national security law and constitutional questions.",            url: "https://www.lawfaremedia.org" },
    { name: "The Contrarian",             description: "Independent legal analysis pushing back on conventional wisdom.",                      url: "https://thecontrarian.substack.com" },
    { name: "Election Law Blog",          description: "Rick Hasen's authoritative coverage of voting rights and election law.",               url: "https://electionlawblog.org" },
    { name: "Steve Vladeck",              description: "National security law professor on courts, the military, and the Constitution.",       url: "https://vladeck.substack.com" },
    { name: "The Law and Policy Brief",   description: "Accessible breakdowns of consequential legal and regulatory decisions.",              url: "https://lawpolicyblog.substack.com" },
  ],
  "Economy": [
    { name: "The Overshoot",              description: "Matthew Klein on macroeconomics, trade, and global financial flows.",                  url: "https://theovershoot.co" },
    { name: "Noahpinion",                 description: "Noah Smith's accessible takes on economics, technology, and policy.",                  url: "https://noahpinion.substack.com" },
    { name: "Doomberg",                   description: "Anonymous energy and commodity experts on markets and geopolitics.",                   url: "https://doomberg.substack.com" },
    { name: "Money Stuff",                description: "Matt Levine's witty and incisive daily newsletter on Wall Street.",                    url: "https://www.bloomberg.com/account/newsletters/money-stuff" },
    { name: "Apricitas Economics",        description: "Data-driven analysis of U.S. economic policy and labor markets.",                     url: "https://apricitas.substack.com" },
  ],
  "Civil Rights": [
    { name: "The Ink",                    description: "Anand Giridharadas on power, inequality, and who gets to shape America.",             url: "https://the.ink" },
    { name: "Momentum",                   description: "Analysis and strategy for the progressive movement and civil rights work.",            url: "https://momentum.substack.com" },
    { name: "Radically Possible",         description: "Optimistic takes on social change, civil rights, and movement building.",             url: "https://radicallypossible.substack.com" },
    { name: "The Reframe",                description: "Roxane Gay on culture, politics, and the ongoing struggle for equity.",               url: "https://roxanegay.substack.com" },
    { name: "Shakesville",                description: "Long-running feminist political commentary and civil rights analysis.",               url: "https://shakesville.substack.com" },
  ],
  "National Security": [
    { name: "Situation Report",           description: "Inside-the-Beltway reporting on defense policy and national security.",               url: "https://sitrep.substack.com" },
    { name: "The Intercept",              description: "Adversarial journalism on surveillance, military power, and civil liberties.",         url: "https://theintercept.com" },
    { name: "Tom Nichols",                description: "Former Naval War College professor on democracy, defense, and expertise.",             url: "https://tom-nichols.substack.com" },
    { name: "Shashank Joshi",             description: "The Economist's defence editor on military strategy and global security.",            url: "https://shashankjoshi.substack.com" },
    { name: "Phillips P. O'Brien",        description: "Military historian on modern warfare, strategy, and defense policy.",                 url: "https://phillipsobrien.substack.com" },
  ],
  "Healthcare": [
    { name: "The Health Care Blog",       description: "Practitioner and policy perspectives on health care reform and delivery.",            url: "https://thehealthcareblog.com" },
    { name: "Absolutely Maybe",           description: "Hilda Bastian on evidence-based medicine, research integrity, and health policy.",    url: "https://hildabastian.substack.com" },
    { name: "Topher Spiro",               description: "Health policy expert on drug pricing, insurance reform, and the ACA.",               url: "https://topherspiro.substack.com" },
    { name: "Health Affairs Forefront",   description: "Timely health policy commentary from leading researchers and practitioners.",         url: "https://www.healthaffairs.org" },
    { name: "American Diagnosis",         description: "Making sense of U.S. health care policy for a general audience.",                    url: "https://americandiagnosis.substack.com" },
  ],
  "Environment": [
    { name: "HEATED",                     description: "Emily Atkin's sharp accountability journalism on climate and fossil fuel politics.",   url: "https://heatedblog.substack.com" },
    { name: "Volts",                      description: "David Roberts' deep dives into clean energy, climate policy, and politics.",          url: "https://www.volts.wtf" },
    { name: "The Crucial Years",          description: "Bill McKibben on climate urgency, activism, and the path forward.",                   url: "https://billmckibben.substack.com" },
    { name: "Climate Psychologist",       description: "The psychology of climate change and how we respond to it.",                          url: "https://climatepsychologist.substack.com" },
    { name: "Heatmap News",               description: "The energy transition and climate politics, explained.",                              url: "https://heatmap.news" },
  ],
  "Education & Science": [
    { name: "The Experimentalist",        description: "How scientific research actually works — and what's going wrong.",                    url: "https://experimentalist.substack.com" },
    { name: "Aftermath",                  description: "Bryan Alexander on the future of higher education and learning.",                     url: "https://bryantalexander.substack.com" },
    { name: "Lenny's Newsletter",         description: "Lenny Rachitsky on product, growth, and how organizations learn.",                   url: "https://www.lennysnewsletter.com" },
    { name: "One Useful Thing",           description: "Ethan Mollick on AI, education, and the science of learning.",                       url: "https://www.oneusefulthing.org" },
    { name: "ScienceAlert",               description: "Breaking science news and research explained for curious readers.",                   url: "https://www.sciencealert.com" },
  ],
  "Immigration": [
    { name: "Immigration Uncovered",      description: "Clear-eyed analysis of immigration law, enforcement, and policy.",                   url: "https://immigrationuncovered.substack.com" },
    { name: "The Dispatch",               description: "Center-right reporting and commentary including immigration policy analysis.",         url: "https://thedispatch.com" },
    { name: "Dara Lind",                  description: "ProPublica immigration reporter's analysis of policy and enforcement.",               url: "https://daralind.substack.com" },
    { name: "Cato at Liberty",            description: "Libertarian policy analysis on immigration reform and open borders.",                 url: "https://www.cato.org/blog" },
    { name: "Roberto Suro",               description: "USC professor and veteran immigration journalist on policy and politics.",            url: "https://robertosuro.substack.com" },
  ],
  "Media & Democracy": [
    { name: "Press Run",                  description: "Eric Boehlert on media failures, press accountability, and political journalism.",    url: "https://pressrun.media" },
    { name: "The Present Age",            description: "Parker Molloy on media, politics, and the information ecosystem.",                   url: "https://present.substack.com" },
    { name: "Platformer",                 description: "Casey Newton's essential newsletter on big tech and its political influence.",         url: "https://www.platformer.news" },
    { name: "Garbage Day",                description: "Ryan Broderick on internet culture, viral media, and online politics.",               url: "https://www.garbageday.email" },
    { name: "Puck News",                  description: "Inside-the-room reporting on media, power, and Washington politics.",                url: "https://puck.news" },
  ],
}
