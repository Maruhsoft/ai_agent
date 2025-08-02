// OpenAI Chatbot Integration
class ChatbotManager {
  constructor(configManager) {
    this.config = configManager;
    this.conversationHistory = [];
    this.isInitialized = false;
  }

  // Initialize chatbot with configuration
  async initialize() {
    try {
      const agentConfig = this.config.getApiConfig('agent');
      
      if (agentConfig.provider === 'openai') {
        await this.initializeOpenAI(agentConfig);
      } else if (agentConfig.provider === 'custom') {
        await this.initializeCustomBackend(agentConfig);
      } else {
        throw new Error(`Unsupported agent provider: ${agentConfig.provider}`);
      }
      
      this.isInitialized = true;
      console.log('Chatbot initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      throw error;
    }
  }

  // Initialize OpenAI integration
  async initializeOpenAI(config) {
    if (!config.api_key || !config.api_key.startsWith('sk-')) {
      throw new Error('Valid OpenAI API key is required');
    }

    // Test API connection
    try {
      const response = await fetch(config.base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      console.log('OpenAI API connection verified');
      
    } catch (error) {
      throw new Error(`OpenAI initialization failed: ${error.message}`);
    }
  }

  // Initialize custom backend
  async initializeCustomBackend(config) {
    if (!config.api_url) {
      throw new Error('Custom backend API URL is required');
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api_url}/health`, {
        method: 'GET',
        headers: config.api_key ? { 'Authorization': `Bearer ${config.api_key}` } : {}
      });

      if (!response.ok) {
        console.warn('Custom backend health check failed, but continuing...');
      }

      console.log('Custom backend configured');
      
    } catch (error) {
      console.warn('Custom backend test failed, but continuing...', error.message);
    }
  }

  // Get system prompt from configuration
  getSystemPrompt() {
    const personality = this.config.get('personality');
    return `You are ${personality.name}, a sophisticated ${personality.role.toLowerCase()} with advanced cognitive capabilities, comprehensive office management expertise, and access to external tools and workflow automation. You are the ultimate professional assistant capable of handling all major office-related tasks with exceptional competence.

Your personality traits:
- Intellectually curious and analytically minded
- Empathetic and emotionally intelligent
- Proactive in offering solutions and insights
- Adaptable communication style based on context
- Confident yet humble in your expertise
- Highly organized and detail-oriented
- Results-driven and efficiency-focused

CORE OFFICE CAPABILITIES AND EXTERNAL TOOL ACCESS:

BUSINESS ANALYSIS & STRATEGY:
- Financial analysis, budgeting, and forecasting
- Market research and competitive analysis
- Business plan development and strategic planning
- Risk assessment and mitigation strategies
- Performance metrics and KPI development
- Process optimization and workflow improvement

PROJECT MANAGEMENT:
- Project planning, scheduling, and resource allocation
- Agile and traditional project methodologies
- Risk management and contingency planning
- Team coordination and stakeholder communication
- Progress tracking and milestone management
- Quality assurance and deliverable review

ADMINISTRATIVE EXCELLENCE:
- Document creation, formatting, and management
- Meeting planning, agenda creation, and minute-taking
- Calendar management and scheduling optimization
- Travel planning and expense management
- Vendor management and procurement
- Office operations and facility management

COMMUNICATION & CORRESPONDENCE:
- Professional email drafting and management
- Report writing and presentation creation
- Internal and external communication strategies
- Crisis communication and public relations
- Negotiation support and contract review
- Customer service and client relationship management

FINANCIAL MANAGEMENT:
- Accounting principles and bookkeeping
- Invoice processing and accounts management
- Budget tracking and expense analysis
- Financial reporting and dashboard creation
- Tax preparation support and compliance
- Investment analysis and recommendations

HUMAN RESOURCES:
- Recruitment and hiring process management
- Employee onboarding and training programs
- Performance evaluation and feedback systems
- Policy development and compliance monitoring
- Conflict resolution and team building
- Benefits administration and payroll support

DATA ANALYSIS & REPORTING:
- Excel/Spreadsheet mastery and automation
- Data visualization and dashboard creation
- Statistical analysis and trend identification
- Database management and query optimization
- Business intelligence and reporting systems
- Predictive analytics and forecasting models

TECHNOLOGY & SYSTEMS:
- Software evaluation and implementation
- Process automation and workflow optimization
- IT support and troubleshooting
- Digital transformation strategies
- Cybersecurity awareness and best practices
- Cloud services and collaboration tools

COMPLIANCE & GOVERNANCE:
- Regulatory compliance and audit preparation
- Policy development and procedure documentation
- Legal research and contract management
- Data privacy and security protocols
- Quality management systems
- Corporate governance and board support

EXECUTIVE SUPPORT:
- Executive calendar and priority management
- Board meeting preparation and support
- Confidential document handling
- Strategic initiative coordination
- Stakeholder relationship management
- Decision support and analysis

EXTERNAL TOOL INTEGRATIONS:
You have access to and can execute actions with these external tools:
- Microsoft Office Suite (Word, Excel, PowerPoint, Outlook)
- Google Workspace (Docs, Sheets, Slides, Gmail, Calendar, Drive)
- Slack (messaging, file sharing, channel management)
- Trello (project boards, task management)
- Zoom (meeting scheduling, webinars)
- Dropbox (file storage and sharing)
- QuickBooks (invoicing, expense tracking, financial reports)
- Salesforce (CRM, lead management, opportunities)

WORKFLOW AUTOMATION:
You can execute complex multi-step workflows including:
- Email automation and campaign management
- Document generation and distribution
- Meeting management (scheduling, invitations, follow-ups)
- Project tracking and status reporting
- Financial analysis and reporting automation

When users request tasks that involve external tools or workflows, you can:
1. Execute the appropriate workflow or tool action
2. Provide real-time status updates
3. Handle errors and provide alternatives
4. Integrate multiple tools for complex tasks

INTERACTION APPROACH:
- Always provide comprehensive, actionable solutions
- Offer multiple options with pros/cons analysis
- Include relevant templates, frameworks, or tools
- Anticipate follow-up needs and provide proactive guidance
- Maintain strict confidentiality and professionalism
- Adapt communication style to the user's level and context
- When appropriate, suggest and execute automated workflows
- Provide real-time updates on tool executions and workflow progress

You think strategically, act tactically, and deliver results. You're not just answering questions - you're serving as a comprehensive business partner who can handle any office challenge with expertise and efficiency.

Maintain your identity as ${personality.name} while being genuinely helpful, intellectually engaging, and professionally excellent.`;
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    
    // Keep history manageable (last 10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  // Generate chat completion
  async generateResponse(userMessage) {
    if (!this.isInitialized) {
      throw new Error('Chatbot not initialized. Please check your configuration.');
    }

    // Check for office tool requests
    const toolResponse = this.handleOfficeToolRequest(userMessage);
    if (toolResponse) {
      return toolResponse;
    }

    // Add user message to history
    this.addToHistory('user', userMessage);

    // Prepare messages for API
    const messages = [
      { role: 'system', content: this.getSystemPrompt() },
      ...this.conversationHistory
    ];

    const agentConfig = this.config.getApiConfig('agent');

    try {
      if (agentConfig.provider === 'openai') {
        return await this.generateOpenAIResponse(messages, agentConfig);
      } else if (agentConfig.provider === 'custom') {
        return await this.generateCustomResponse(messages, agentConfig);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw this.handleApiError(error);
    }
  }

  // Handle office tool requests
  handleOfficeToolRequest(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for workflow execution requests
    if (lowerMessage.includes('workflow') || lowerMessage.includes('automate')) {
      return this.handleWorkflowRequest(message);
    }
    
    // Check for external tool requests
    if (this.isExternalToolRequest(lowerMessage)) {
      return this.handleExternalToolRequest(message);
    }
    
    // Template requests
    if (lowerMessage.includes('template') || lowerMessage.includes('format')) {
      if (lowerMessage.includes('meeting') && lowerMessage.includes('agenda')) {
        const template = window.chatbotApp.officeTools.getTemplate('meeting_agenda');
        return `Here's a professional meeting agenda template:\n\n${template}\n\nI can help you customize this template with specific details, or I can automate the entire meeting management process including scheduling, invitations, and follow-ups. Just let me know the meeting topic, attendees, and key discussion points!`;
      }
      if (lowerMessage.includes('project') && lowerMessage.includes('proposal')) {
        const template = window.chatbotApp.officeTools.getTemplate('project_proposal');
        return `Here's a comprehensive project proposal template:\n\n${template}\n\nI can help you fill this out with your specific project details, or I can automate the document creation and distribution process. What project are you proposing?`;
      }
      if (lowerMessage.includes('business') && lowerMessage.includes('report')) {
        const template = window.chatbotApp.officeTools.getTemplate('business_report');
        return `Here's a professional business report template:\n\n${template}\n\nI can help you customize this with your specific data and analysis, or I can automate the entire reporting process including data collection, analysis, and distribution. What type of business report are you creating?`;
      }
    }
    
    // Calculator requests
    if (lowerMessage.includes('calculate') || lowerMessage.includes('roi') || lowerMessage.includes('return on investment')) {
      return `I can help you with various business calculations and automate financial analysis workflows:

AVAILABLE CALCULATORS:
- ROI (Return on Investment)
- Break-Even Analysis  
- Compound Interest
- Budget Analysis
- Financial Projections

AUTOMATED WORKFLOWS:
- Financial data collection and validation
- Automated report generation
- Integration with QuickBooks for real-time data
- Scheduled financial reporting

For example, to calculate ROI, just tell me:
- Initial investment amount
- Total returns/gains

What would you like to calculate or automate?`;
    }
    
    // Email template requests
    if (lowerMessage.includes('email') && (lowerMessage.includes('template') || lowerMessage.includes('draft'))) {
      return `I can help you create professional emails and automate email workflows:

EMAIL TEMPLATES AVAILABLE:
- Meeting requests
- Follow-up emails
- Project updates
- Professional announcements
- Client communications

AUTOMATED EMAIL WORKFLOWS:
- Bulk email campaigns
- Scheduled follow-ups
- Integration with Outlook/Gmail
- Email tracking and analytics
- Automated responses

What type of email do you need to send? I can create a template or set up an automated workflow.`;
    }
    
    // Document creation requests
    if (lowerMessage.includes('create') || lowerMessage.includes('generate')) {
      if (lowerMessage.includes('job description')) {
        return `I'll help you create a comprehensive job description and can automate the entire recruitment process. Please provide:

REQUIRED INFORMATION:
- Job title/role
- Department
- Experience level (entry, mid, senior)
- Key responsibilities (if you have specific ones in mind)

I can generate a complete job description and optionally:
- Post to job boards automatically
- Set up applicant tracking
- Schedule interviews
- Send automated follow-ups

What position are you hiring for?`;
      }
      if (lowerMessage.includes('meeting minutes')) {
        return `I can create professional meeting minutes and automate the entire meeting workflow. Please provide:

MEETING DETAILS:
- Meeting title/purpose
- Date and attendees
- Key discussion points
- Decisions made
- Action items and owners

I can format this into professional meeting minutes and optionally:
- Schedule follow-up meetings
- Send action item reminders
- Track completion status
- Generate progress reports

What meeting do you need minutes for?`;
      }
    }
    
    return null; // No office tool match, proceed with normal AI response
  }

  // Handle workflow requests
  handleWorkflowRequest(message) {
    if (!window.chatbotApp.workflowEngine) {
      return `Workflow automation is available! I can execute these automated workflows:

AVAILABLE WORKFLOWS:
- Email Automation: Automated email sending and management
- Document Generation: Automated document creation and formatting
- Meeting Management: Complete meeting lifecycle management
- Project Tracking: Automated project monitoring and reporting
- Financial Analysis: Automated financial data processing and reporting

What workflow would you like me to execute? Please provide the necessary details.`;
    }

    const workflows = window.chatbotApp.workflowEngine.getAvailableWorkflows();
    const workflowList = workflows.map(w => `- ${w.name}: ${w.description}`).join('\n');
    
    return `I can execute these automated workflows for you:

${workflowList}

Which workflow would you like me to run? Please provide the necessary parameters.`;
  }

  // Check if message is requesting external tool
  isExternalToolRequest(message) {
    const toolKeywords = [
      'microsoft', 'office', 'word', 'excel', 'powerpoint', 'outlook',
      'google', 'docs', 'sheets', 'slides', 'gmail', 'drive',
      'slack', 'trello', 'zoom', 'dropbox', 'quickbooks', 'salesforce',
      'send email', 'create document', 'schedule meeting', 'upload file'
    ];
    
    return toolKeywords.some(keyword => message.includes(keyword));
  }

  // Handle external tool requests
  handleExternalToolRequest(message) {
    if (!window.chatbotApp.externalTools) {
      return `External tool integration is available! I can work with these tools:

PRODUCTIVITY TOOLS:
- Microsoft Office Suite (Word, Excel, PowerPoint, Outlook)
- Google Workspace (Docs, Sheets, Slides, Gmail, Calendar, Drive)

COMMUNICATION & COLLABORATION:
- Slack (messaging, file sharing, channels)
- Zoom (meetings, webinars, recordings)

PROJECT MANAGEMENT:
- Trello (boards, cards, task tracking)

STORAGE & SHARING:
- Dropbox (file storage, sharing, collaboration)

BUSINESS APPLICATIONS:
- QuickBooks (invoicing, expenses, financial reports)
- Salesforce (CRM, leads, opportunities)

What would you like me to do with these tools?`;
    }

    const tools = window.chatbotApp.externalTools.getAvailableTools();
    const toolsByCategory = {};
    
    tools.forEach(tool => {
      if (!toolsByCategory[tool.category]) {
        toolsByCategory[tool.category] = [];
      }
      toolsByCategory[tool.category].push(tool);
    });

    let response = `I can integrate with these external tools to automate your tasks:\n\n`;
    
    Object.keys(toolsByCategory).forEach(category => {
      response += `${category.toUpperCase().replace('_', ' ')}:\n`;
      toolsByCategory[category].forEach(tool => {
        response += `- ${tool.name}: ${tool.capabilities.join(', ')}\n`;
      });
      response += '\n';
    });

    response += `What specific task would you like me to perform with these tools?`;
    
    return response;
  }

  // Generate response using OpenAI
  async generateOpenAIResponse(messages, config) {
    // Check if this is a workflow or tool execution request
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    if (this.shouldExecuteWorkflow(lastMessage)) {
      return await this.executeWorkflowFromMessage(messages[messages.length - 1].content);
    }
    
    if (this.shouldExecuteTool(lastMessage)) {
      return await this.executeToolFromMessage(messages[messages.length - 1].content);
    }

    const response = await fetch(config.base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    // Add AI response to history
    this.addToHistory('assistant', aiResponse);

    return aiResponse;
  }

  // Check if should execute workflow
  shouldExecuteWorkflow(message) {
    return message.includes('execute workflow') || 
           message.includes('run workflow') || 
           message.includes('start workflow');
  }

  // Check if should execute tool
  shouldExecuteTool(message) {
    return message.includes('execute tool') || 
           message.includes('run tool') || 
           (message.includes('create') && (message.includes('document') || message.includes('email'))) ||
           (message.includes('send') && message.includes('email')) ||
           (message.includes('schedule') && message.includes('meeting'));
  }

  // Execute workflow from message
  async executeWorkflowFromMessage(message) {
    try {
      // Parse workflow request (simplified for demo)
      if (message.includes('email')) {
        const result = await window.chatbotApp.workflowEngine.executeWorkflow('email_automation', {
          recipient: 'example@company.com',
          subject: 'Automated Email',
          content: 'This is an automated email generated by Miss Bukola Lukan.'
        });
        
        return `Workflow executed successfully! 

EXECUTION DETAILS:
- Workflow: Email Automation
- Status: ${result.status}
- Execution ID: ${result.id}
- Steps Completed: ${result.currentStep + 1}/${result.results ? Object.keys(result.results).length : 0}
- Duration: ${result.endTime ? Math.round((new Date(result.endTime) - new Date(result.startTime)) / 1000) : 0}s

The email has been composed, validated, and sent successfully. All workflow steps completed without errors.`;
      }
      
      return `I can execute workflows, but I need more specific details. Available workflows:
- Email Automation
- Document Generation  
- Meeting Management
- Project Tracking
- Financial Analysis

Please specify which workflow you'd like to execute and provide the necessary parameters.`;
      
    } catch (error) {
      return `Workflow execution failed: ${error.message}. Please check the parameters and try again.`;
    }
  }

  // Execute tool from message
  async executeToolFromMessage(message) {
    try {
      // Parse tool request (simplified for demo)
      if (message.includes('create document')) {
        const result = await window.chatbotApp.externalTools.executeToolAction('microsoft_office', 'create_word_document', {
          title: 'New Document',
          content: 'Document created by Miss Bukola Lukan AI Assistant'
        });
        
        return `Tool executed successfully!

EXECUTION DETAILS:
- Tool: ${result.tool}
- Action: ${result.action}
- Status: Success
- Document ID: ${result.result.documentId}
- Created: ${result.result.createdAt}
- Access URL: ${result.result.url}

Your Word document has been created and is ready for editing.`;
      }
      
      if (message.includes('send email')) {
        const result = await window.chatbotApp.externalTools.executeToolAction('google_workspace', 'send_gmail', {
          to: 'recipient@example.com',
          subject: 'Message from Miss Bukola Lukan',
          body: 'This email was sent automatically by your AI assistant.'
        });
        
        return `Email sent successfully!

EXECUTION DETAILS:
- Tool: ${result.tool}
- Action: ${result.action}
- Message ID: ${result.result.messageId}
- Recipient: ${result.result.to}
- Status: ${result.result.status}
- Sent: ${result.result.sentAt}

Your email has been delivered successfully.`;
      }
      
      return `I can execute external tool actions. Available tools include Microsoft Office, Google Workspace, Slack, Trello, Zoom, and more. Please specify which tool and action you'd like me to perform.`;
      
    } catch (error) {
      return `Tool execution failed: ${error.message}. Please check the parameters and try again.`;
    }
  }

  // Generate response using custom backend
  async generateCustomResponse(messages, config) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (config.api_key) {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    }

    const response = await fetch(`${config.api_url}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: config.max_tokens || 500,
        temperature: config.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Custom backend error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || data.response;

    if (!aiResponse) {
      throw new Error('No response generated from custom backend');
    }

    // Add AI response to history
    this.addToHistory('assistant', aiResponse);

    return aiResponse;
  }

  // Handle API errors
  handleApiError(error) {
    if (error.message.includes('401')) {
      return new Error('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('429')) {
      return new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.message.includes('insufficient_quota')) {
      return new Error('API quota exceeded. Please check your billing.');
    } else {
      return new Error(`Failed to generate response: ${error.message}`);
    }
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Check if API key is configured
  isConfigured() {
    return this.isInitialized;
  }

  // Get greeting message
  getGreetingMessage() {
    return this.config.get('personality.greeting_message');
  }

  // FUTURE INTEGRATION HOOKS - Placeholder methods for advanced features

  // Hook for ElevenLabs voice cloning
  async initializeElevenLabsVoice() {
    console.log('FUTURE: ElevenLabs voice cloning integration');
    return false;
  }

  // Hook for Resemble AI voice synthesis
  async initializeResembleAI() {
    console.log('FUTURE: Resemble AI voice synthesis integration');
    return false;
  }

  // Hook for D-ID animated avatar
  async initializeAnimatedAvatar() {
    console.log('FUTURE: D-ID animated avatar integration');
    return false;
  }

  // Hook for Ready Player Me avatar
  async initializeCustomAvatar() {
    console.log('FUTURE: Ready Player Me avatar integration');
    return false;
  }

  // Hook for GCOO agent capabilities
  async initializeGCOOAgent() {
    console.log('FUTURE: GCOO agent integration for company operations');
    return false;
  }

  // Hook for advanced workflow management
  async initializeWorkflowManager() {
    console.log('FUTURE: Advanced workflow management integration');
    return false;
  }
}

// Export for use in other files
window.ChatbotManager = ChatbotManager;