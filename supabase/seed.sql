insert into public.skills (name, category)
select v.name, v.category
from (values
  ('HTML', 'frontend'),
  ('CSS', 'frontend'),
  ('JavaScript', 'frontend'),
  ('TypeScript', 'frontend'),
  ('React', 'frontend'),
  ('Vue.js', 'frontend'),
  ('Angular', 'frontend'),
  ('Next.js', 'frontend'),
  ('Node.js', 'backend'),
  ('Express.js', 'backend'),
  ('Python', 'backend'),
  ('Django', 'backend'),
  ('Java', 'backend'),
  ('Spring Boot', 'backend'),
  ('Go', 'backend'),
  ('Rust', 'backend'),
  ('SQL', 'database'),
  ('PostgreSQL', 'database'),
  ('MongoDB', 'database'),
  ('Redis', 'database'),
  ('Docker', 'devops'),
  ('Kubernetes', 'devops'),
  ('AWS', 'cloud'),
  ('Azure', 'cloud'),
  ('GCP', 'cloud'),
  ('Git', 'tools'),
  ('GitHub Actions', 'devops'),
  ('Linux', 'devops'),
  ('Bash', 'devops'),
  ('Terraform', 'devops'),
  ('CI/CD', 'devops'),
  ('Node Package Manager', 'tools'),
  ('GraphQL', 'backend'),
  ('REST API', 'backend'),
  ('Tailwind CSS', 'frontend'),
  ('Redux', 'frontend'),
  ('Zustand', 'frontend'),
  ('Figma', 'design'),
  ('UI/UX Design', 'design'),
  ('Accessibility', 'design'),
  ('SEO', 'marketing'),
  ('Testing', 'quality'),
  ('Vitest', 'quality'),
  ('Playwright', 'quality'),
  ('Machine Learning', 'data'),
  ('TensorFlow', 'data'),
  ('PyTorch', 'data'),
  ('NumPy', 'data'),
  ('Pandas', 'data'),
  ('Apache Spark', 'data'),
  ('Snowflake', 'data'),
  ('dbt', 'data'),
  ('MLOps', 'data'),
  ('LLMOps', 'data'),
  ('Prompt Engineering', 'data'),
  ('Natural Language Processing', 'data'),
  ('Computer Vision', 'data'),
  ('Data Analysis', 'data'),
  ('Power BI', 'data'),
  ('Tableau', 'data'),
  ('Statistics', 'data'),
  ('Excel', 'data'),
  ('React Native', 'mobile'),
  ('Flutter', 'mobile'),
  ('Swift', 'mobile'),
  ('Kotlin', 'mobile'),
  ('.NET', 'backend'),
  ('ASP.NET Core', 'backend'),
  ('FastAPI', 'backend'),
  ('Microservices', 'backend'),
  ('System Design', 'backend'),
  ('Kafka', 'backend'),
  ('RabbitMQ', 'backend'),
  ('Jest', 'quality'),
  ('Cypress', 'quality'),
  ('Selenium', 'quality'),
  ('SRE', 'devops'),
  ('Observability', 'devops'),
  ('Monitoring', 'devops'),
  ('Grafana', 'devops'),
  ('Prometheus', 'devops'),
  ('OAuth', 'security'),
  ('Threat Modeling', 'security'),
  ('Risk Assessment', 'security'),
  ('Wireframing', 'design'),
  ('UX Research', 'design'),
  ('Product Analytics', 'business'),
  ('Jira', 'management'),
  ('Business Analysis', 'business'),
  ('Customer Research', 'business'),
  ('Copywriting', 'marketing'),
  ('Content Strategy', 'marketing'),
  ('Digital Marketing', 'marketing'),
  ('A/B Testing', 'marketing'),
  ('Community Management', 'marketing'),
  ('Technical Writing', 'documentation'),
  ('Documentation', 'documentation'),
  ('Knowledge Base Management', 'documentation'),
  ('Cybersecurity', 'security'),
  ('Penetration Testing', 'security'),
  ('Incident Response', 'security'),
  ('Agile/Scrum', 'management'),
  ('Project Management', 'management'),
  ('Roadmapping', 'management'),
  ('Stakeholder Management', 'management'),
  ('Public Speaking', 'soft'),
  ('Problem Solving', 'soft'),
  ('Mentoring', 'soft'),
  ('Time Management', 'soft'),
  ('Communication', 'soft'),
  ('Leadership', 'soft')
) as v(name, category)
where not exists (
  select 1
  from public.skills s
  where s.name = v.name
);

insert into public.jobs (role, required_skills, salary_min, salary_max, category)
select v.role, v.required_skills, v.salary_min, v.salary_max, v.category
from (values
  ('Frontend Developer', array['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Next.js']::text[], 70000, 120000, 'frontend'),
  ('Backend Developer', array['Node.js', 'Express.js', 'SQL', 'REST API', 'Docker', 'AWS']::text[], 80000, 135000, 'backend'),
  ('Full Stack Developer', array['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Docker', 'GraphQL']::text[], 90000, 145000, 'full-stack'),
  ('Data Scientist', array['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'TensorFlow']::text[], 95000, 150000, 'data'),
  ('DevOps Engineer', array['Git', 'CI/CD', 'Docker', 'Kubernetes', 'AWS', 'Azure']::text[], 100000, 160000, 'devops'),
  ('Cloud Engineer', array['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD']::text[], 105000, 165000, 'cloud'),
  ('Product Designer', array['Figma', 'UI/UX Design', 'Communication', 'Agile/Scrum']::text[], 70000, 125000, 'design'),
  ('Security Engineer', array['Cybersecurity', 'Git', 'Docker', 'AWS']::text[], 95000, 155000, 'security')
  ,('QA Engineer', array['Testing', 'Playwright', 'Vitest', 'Accessibility', 'GitHub Actions']::text[], 65000, 110000, 'quality')
  ,('Mobile Developer', array['Java', 'TypeScript', 'UI/UX Design', 'Accessibility', 'Git']::text[], 80000, 140000, 'mobile')
  ,('Platform Engineer', array['Linux', 'Bash', 'Docker', 'Kubernetes', 'Terraform', 'AWS']::text[], 110000, 170000, 'devops')
  ,('Data Analyst', array['Excel', 'SQL', 'Data Analysis', 'Power BI', 'Tableau']::text[], 60000, 105000, 'data')
  ,('ML Engineer', array['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker']::text[], 110000, 175000, 'data')
  ,('Technical Lead', array['Leadership', 'Communication', 'Project Management', 'Agile/Scrum', 'Git']::text[], 120000, 180000, 'management')
  ,('Content Strategist', array['Content Strategy', 'Copywriting', 'SEO', 'Communication', 'Project Management']::text[], 65000, 115000, 'marketing')
  ,('Business Analyst', array['Business Analysis', 'Customer Research', 'SQL', 'Excel', 'Communication']::text[], 70000, 125000, 'business')
  ,('Engineering Manager', array['Leadership', 'Mentoring', 'Roadmapping', 'Project Management', 'Communication']::text[], 135000, 190000, 'management')
  ,('Technical Writer', array['Technical Writing', 'Communication', 'Problem Solving', 'Git', 'Node Package Manager']::text[], 60000, 100000, 'documentation')
  ,('Marketing Specialist', array['Digital Marketing', 'A/B Testing', 'Copywriting', 'SEO', 'Customer Research']::text[], 60000, 115000, 'marketing')
  ,('Community Manager', array['Community Management', 'Communication', 'Public Speaking', 'Problem Solving', 'Stakeholder Management']::text[], 55000, 95000, 'marketing')
  ,('Support Engineer', array['Communication', 'Problem Solving', 'Documentation', 'Git', 'Incident Response']::text[], 65000, 105000, 'support')
  ,('Product Manager', array['Project Management', 'Stakeholder Management', 'Roadmapping', 'Customer Research', 'Communication']::text[], 110000, 175000, 'product')
  ,('Operations Manager', array['Project Management', 'Leadership', 'Time Management', 'Communication', 'Problem Solving']::text[], 85000, 140000, 'operations')
  ,('AI Engineer', array['Python', 'Machine Learning', 'PyTorch', 'Prompt Engineering', 'MLOps']::text[], 120000, 190000, 'data')
  ,('Data Engineer', array['Python', 'SQL', 'Apache Spark', 'Snowflake', 'dbt']::text[], 105000, 175000, 'data')
  ,('Site Reliability Engineer', array['SRE', 'Linux', 'Kubernetes', 'Observability', 'Prometheus']::text[], 115000, 180000, 'devops')
  ,('Cloud Architect', array['AWS', 'Azure', 'System Design', 'Terraform', 'Microservices']::text[], 130000, 200000, 'cloud')
  ,('QA Automation Engineer', array['Testing', 'Cypress', 'Playwright', 'Jest', 'CI/CD']::text[], 80000, 130000, 'quality')
  ,('Cybersecurity Analyst', array['Cybersecurity', 'Threat Modeling', 'Risk Assessment', 'Incident Response', 'OAuth']::text[], 90000, 145000, 'security')
  ,('Mobile App Developer', array['React Native', 'Flutter', 'Kotlin', 'Swift', 'UI/UX Design']::text[], 90000, 150000, 'mobile')
  ,('Solutions Architect', array['System Design', 'AWS', 'Azure', 'Microservices', 'Leadership']::text[], 125000, 195000, 'cloud')
  ,('Scrum Master', array['Agile/Scrum', 'Jira', 'Stakeholder Management', 'Communication', 'Mentoring']::text[], 85000, 135000, 'management')
  ,('UX Researcher', array['UX Research', 'Wireframing', 'Figma', 'Communication', 'Data Analysis']::text[], 75000, 125000, 'design')
) as v(role, required_skills, salary_min, salary_max, category)
where not exists (
  select 1
  from public.jobs j
  where j.role = v.role
);