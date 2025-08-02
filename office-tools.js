// Office Tools and Utilities Manager
class OfficeToolsManager {
  constructor() {
    this.templates = new Map();
    this.calculators = new Map();
    this.generators = new Map();
    this.initializeTools();
  }

  // Initialize all office tools
  initializeTools() {
    this.initializeTemplates();
    this.initializeCalculators();
    this.initializeGenerators();
  }

  // Initialize document templates
  initializeTemplates() {
    this.templates.set('meeting_agenda', {
      name: 'Meeting Agenda',
      template: `
MEETING AGENDA

Meeting: [Meeting Title]
Date: [Date]
Time: [Start Time] - [End Time]
Location: [Location/Virtual Link]
Attendees: [List of Attendees]

AGENDA ITEMS:
1. Welcome & Introductions (5 min)
2. Review of Previous Meeting Minutes (10 min)
3. [Agenda Item 1] (15 min)
   - Discussion points
   - Action items
4. [Agenda Item 2] (20 min)
   - Discussion points
   - Action items
5. Next Steps & Action Items (10 min)
6. Next Meeting Date & Adjournment (5 min)

PREPARATION REQUIRED:
- [Item 1]
- [Item 2]

ACTION ITEMS FROM PREVIOUS MEETING:
- [Previous Action 1] - [Owner] - [Status]
- [Previous Action 2] - [Owner] - [Status]
      `
    });

    this.templates.set('project_proposal', {
      name: 'Project Proposal',
      template: `
PROJECT PROPOSAL

Project Title: [Project Name]
Prepared by: [Your Name]
Date: [Date]
Department: [Department]

EXECUTIVE SUMMARY
[Brief overview of the project, its objectives, and expected outcomes]

PROJECT OBJECTIVES
- Primary Objective: [Main goal]
- Secondary Objectives:
  • [Objective 1]
  • [Objective 2]
  • [Objective 3]

SCOPE OF WORK
[Detailed description of what will be accomplished]

TIMELINE
Phase 1: [Description] - [Start Date] to [End Date]
Phase 2: [Description] - [Start Date] to [End Date]
Phase 3: [Description] - [Start Date] to [End Date]

BUDGET ESTIMATE
Personnel: $[Amount]
Equipment: $[Amount]
Materials: $[Amount]
Other Expenses: $[Amount]
Total: $[Total Amount]

RESOURCES REQUIRED
- Human Resources: [List required team members]
- Equipment: [List required equipment]
- Software/Tools: [List required tools]

RISK ASSESSMENT
- Risk 1: [Description] - Mitigation: [Strategy]
- Risk 2: [Description] - Mitigation: [Strategy]

SUCCESS METRICS
- [Metric 1]: [Target]
- [Metric 2]: [Target]
- [Metric 3]: [Target]

APPROVAL REQUIRED
Project Sponsor: _________________ Date: _______
Department Head: ________________ Date: _______
      `
    });

    this.templates.set('business_report', {
      name: 'Business Report',
      template: `
BUSINESS REPORT

Report Title: [Title]
Reporting Period: [Period]
Prepared by: [Name]
Date: [Date]

EXECUTIVE SUMMARY
[Key findings, conclusions, and recommendations in 2-3 paragraphs]

KEY PERFORMANCE INDICATORS
• Revenue: $[Amount] ([% Change] vs. previous period)
• Expenses: $[Amount] ([% Change] vs. previous period)
• Profit Margin: [%] ([Change] vs. previous period)
• Customer Satisfaction: [Score/Rating]
• [Additional KPI]: [Value]

DETAILED ANALYSIS

Performance Highlights:
- [Achievement 1]
- [Achievement 2]
- [Achievement 3]

Areas of Concern:
- [Issue 1]: [Description and impact]
- [Issue 2]: [Description and impact]

Market Conditions:
[Analysis of external factors affecting performance]

RECOMMENDATIONS
1. [Recommendation 1]
   - Action: [Specific action]
   - Timeline: [When]
   - Owner: [Who]

2. [Recommendation 2]
   - Action: [Specific action]
   - Timeline: [When]
   - Owner: [Who]

NEXT STEPS
- [Step 1] - Due: [Date]
- [Step 2] - Due: [Date]
- [Step 3] - Due: [Date]

APPENDICES
- Appendix A: [Supporting data]
- Appendix B: [Charts/Graphs]
      `
    });
  }

  // Initialize financial calculators
  initializeCalculators() {
    this.calculators.set('roi', {
      name: 'Return on Investment (ROI)',
      calculate: (investment, returns) => {
        const roi = ((returns - investment) / investment) * 100;
        return {
          roi: roi.toFixed(2),
          interpretation: roi > 0 ? 'Positive ROI - Profitable investment' : 'Negative ROI - Loss on investment'
        };
      }
    });

    this.calculators.set('break_even', {
      name: 'Break-Even Analysis',
      calculate: (fixedCosts, pricePerUnit, variableCostPerUnit) => {
        const breakEvenUnits = fixedCosts / (pricePerUnit - variableCostPerUnit);
        const breakEvenRevenue = breakEvenUnits * pricePerUnit;
        return {
          units: Math.ceil(breakEvenUnits),
          revenue: breakEvenRevenue.toFixed(2),
          interpretation: `Need to sell ${Math.ceil(breakEvenUnits)} units to break even`
        };
      }
    });

    this.calculators.set('compound_interest', {
      name: 'Compound Interest',
      calculate: (principal, rate, time, compoundingFrequency = 12) => {
        const amount = principal * Math.pow((1 + rate / compoundingFrequency), compoundingFrequency * time);
        const interest = amount - principal;
        return {
          finalAmount: amount.toFixed(2),
          interestEarned: interest.toFixed(2),
          interpretation: `Investment grows to $${amount.toFixed(2)} over ${time} years`
        };
      }
    });
  }

  // Initialize content generators
  initializeGenerators() {
    this.generators.set('email_templates', {
      name: 'Professional Email Templates',
      generate: (type, context = {}) => {
        const templates = {
          meeting_request: `
Subject: Meeting Request - ${context.topic || '[Topic]'}

Dear ${context.recipient || '[Recipient Name]'},

I hope this email finds you well. I would like to schedule a meeting to discuss ${context.topic || '[meeting topic]'}.

Proposed Details:
• Date: ${context.date || '[Proposed Date]'}
• Time: ${context.time || '[Proposed Time]'}
• Duration: ${context.duration || '[Estimated Duration]'}
• Location: ${context.location || '[Location/Virtual Link]'}

Agenda:
${context.agenda || '• [Agenda item 1]\n• [Agenda item 2]\n• [Agenda item 3]'}

Please let me know if this time works for you, or suggest an alternative that better fits your schedule.

Best regards,
${context.sender || '[Your Name]'}
          `,
          follow_up: `
Subject: Follow-up on ${context.topic || '[Topic]'}

Dear ${context.recipient || '[Recipient Name]'},

I wanted to follow up on our ${context.previous_interaction || 'previous discussion'} regarding ${context.topic || '[topic]'}.

${context.summary || '[Brief summary of previous interaction]'}

Next Steps:
${context.next_steps || '• [Action item 1]\n• [Action item 2]'}

Please let me know if you have any questions or if there's anything else I can assist you with.

Best regards,
${context.sender || '[Your Name]'}
          `,
          project_update: `
Subject: Project Update - ${context.project || '[Project Name]'}

Dear ${context.recipient || 'Team'},

I'm writing to provide an update on the ${context.project || '[Project Name]'} project.

Current Status: ${context.status || '[Status]'}

Completed This Period:
${context.completed || '• [Completed item 1]\n• [Completed item 2]'}

Upcoming Milestones:
${context.upcoming || '• [Milestone 1] - [Date]\n• [Milestone 2] - [Date]'}

Issues/Risks:
${context.issues || '• [Issue 1] - [Mitigation plan]\n• [Issue 2] - [Mitigation plan]'}

Please reach out if you have any questions or concerns.

Best regards,
${context.sender || '[Your Name]'}
          `
        };
        return templates[type] || 'Template not found';
      }
    });

    this.generators.set('job_descriptions', {
      name: 'Job Description Generator',
      generate: (role, department, level) => {
        return `
JOB DESCRIPTION

Position: ${role}
Department: ${department}
Level: ${level}
Reports to: [Manager Title]

POSITION SUMMARY
[Brief description of the role and its purpose within the organization]

KEY RESPONSIBILITIES
• [Primary responsibility 1]
• [Primary responsibility 2]
• [Primary responsibility 3]
• [Primary responsibility 4]
• [Primary responsibility 5]

REQUIRED QUALIFICATIONS
Education:
• [Degree requirement]
• [Certification requirements]

Experience:
• [Years of experience] in [relevant field]
• Experience with [specific tools/technologies]
• [Industry experience requirements]

Skills:
• [Technical skill 1]
• [Technical skill 2]
• [Soft skill 1]
• [Soft skill 2]

PREFERRED QUALIFICATIONS
• [Preferred qualification 1]
• [Preferred qualification 2]
• [Preferred qualification 3]

COMPENSATION & BENEFITS
• Competitive salary commensurate with experience
• Health, dental, and vision insurance
• 401(k) with company matching
• [Additional benefits]

APPLICATION PROCESS
Please submit your resume and cover letter to [email/portal].
        `;
      }
    });
  }

  // Get available templates
  getTemplates() {
    return Array.from(this.templates.entries()).map(([key, value]) => ({
      id: key,
      name: value.name
    }));
  }

  // Get template content
  getTemplate(templateId) {
    return this.templates.get(templateId)?.template || null;
  }

  // Get available calculators
  getCalculators() {
    return Array.from(this.calculators.entries()).map(([key, value]) => ({
      id: key,
      name: value.name
    }));
  }

  // Perform calculation
  calculate(calculatorId, ...params) {
    const calculator = this.calculators.get(calculatorId);
    return calculator ? calculator.calculate(...params) : null;
  }

  // Generate content
  generateContent(generatorId, type, context) {
    const generator = this.generators.get(generatorId);
    return generator ? generator.generate(type, context) : null;
  }

  // Create formatted document
  createDocument(type, data) {
    const timestamp = new Date().toLocaleDateString();
    const header = `Generated by Miss Bukola Lukan AI Assistant on ${timestamp}\n${'='.repeat(60)}\n\n`;
    
    switch (type) {
      case 'meeting_minutes':
        return this.createMeetingMinutes(data);
      case 'action_plan':
        return this.createActionPlan(data);
      case 'budget_analysis':
        return this.createBudgetAnalysis(data);
      default:
        return header + 'Document type not supported';
    }
  }

  // Create meeting minutes
  createMeetingMinutes(data) {
    return `
MEETING MINUTES

Meeting: ${data.title || '[Meeting Title]'}
Date: ${data.date || new Date().toLocaleDateString()}
Time: ${data.time || '[Time]'}
Location: ${data.location || '[Location]'}

ATTENDEES:
${data.attendees ? data.attendees.map(a => `• ${a}`).join('\n') : '• [Attendee list]'}

AGENDA ITEMS DISCUSSED:
${data.agenda ? data.agenda.map((item, i) => `${i + 1}. ${item}`).join('\n') : '[Agenda items]'}

KEY DECISIONS:
${data.decisions ? data.decisions.map(d => `• ${d}`).join('\n') : '• [Decision 1]\n• [Decision 2]'}

ACTION ITEMS:
${data.actions ? data.actions.map(a => `• ${a.task} - Assigned to: ${a.owner} - Due: ${a.due}`).join('\n') : '• [Action item] - Owner - Due date'}

NEXT MEETING:
Date: ${data.nextMeeting || '[Next meeting date]'}
    `;
  }

  // Create action plan
  createActionPlan(data) {
    return `
ACTION PLAN

Project/Initiative: ${data.title || '[Project Name]'}
Owner: ${data.owner || '[Project Owner]'}
Created: ${new Date().toLocaleDateString()}

OBJECTIVE:
${data.objective || '[Primary objective of this action plan]'}

ACTION ITEMS:

${data.actions ? data.actions.map((action, i) => `
${i + 1}. ${action.task}
   Owner: ${action.owner}
   Due Date: ${action.due}
   Priority: ${action.priority || 'Medium'}
   Status: ${action.status || 'Not Started'}
   Notes: ${action.notes || 'N/A'}
`).join('\n') : '[Action items will be listed here]'}

SUCCESS METRICS:
${data.metrics ? data.metrics.map(m => `• ${m}`).join('\n') : '• [Metric 1]\n• [Metric 2]'}

RISKS & MITIGATION:
${data.risks ? data.risks.map(r => `• Risk: ${r.risk} - Mitigation: ${r.mitigation}`).join('\n') : '• [Risk] - [Mitigation strategy]'}
    `;
  }

  // Create budget analysis
  createBudgetAnalysis(data) {
    const total = data.items ? data.items.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
    
    return `
BUDGET ANALYSIS

Budget Period: ${data.period || '[Budget Period]'}
Department: ${data.department || '[Department]'}
Prepared: ${new Date().toLocaleDateString()}

BUDGET BREAKDOWN:

${data.items ? data.items.map(item => `
${item.category}: $${item.amount?.toLocaleString() || '0'}
  Description: ${item.description || 'N/A'}
  Variance: ${item.variance ? (item.variance > 0 ? '+' : '') + item.variance + '%' : 'N/A'}
`).join('\n') : '[Budget items will be listed here]'}

SUMMARY:
Total Budget: $${total.toLocaleString()}
${data.previousTotal ? `Previous Period: $${data.previousTotal.toLocaleString()}` : ''}
${data.previousTotal ? `Change: ${((total - data.previousTotal) / data.previousTotal * 100).toFixed(1)}%` : ''}

ANALYSIS:
${data.analysis || '[Budget analysis and recommendations will appear here]'}

RECOMMENDATIONS:
${data.recommendations ? data.recommendations.map(r => `• ${r}`).join('\n') : '• [Recommendation 1]\n• [Recommendation 2]'}
    `;
  }
}

// Export for use in other files
window.OfficeToolsManager = OfficeToolsManager;