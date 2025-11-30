import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const manualHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rekha Library Manual</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      color: #0F1A33;
      font-size: 2.5rem;
      margin-bottom: 1rem;
      border-bottom: 4px solid #C9A34E;
      padding-bottom: 0.5rem;
    }

    h2 {
      color: #0F1A33;
      font-size: 1.75rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid #C9A34E;
      padding-bottom: 0.5rem;
    }

    h3 {
      color: #0F1A33;
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    h4 {
      color: #374151;
      font-size: 1.1rem;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }

    p {
      margin-bottom: 1rem;
      line-height: 1.75;
    }

    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #0F1A33 0%, #C9A34E 100%);
      color: white;
      border-radius: 1rem;
    }

    .header h1 {
      color: white;
      border: none;
    }

    .section {
      margin-bottom: 3rem;
      page-break-inside: avoid;
    }

    .info-box {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.5rem;
    }

    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.5rem;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
    }

    strong {
      color: #0F1A33;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📘 Rekha Library User Manual</h1>
    <p>Comprehensive Guide for Staff and Members</p>
    <p style="margin-top: 1rem; font-size: 0.9rem;">Risk Management Library System</p>
  </div>

  <div class="section">
    <h2>Welcome & Purpose</h2>
    <p>
      Welcome to <strong>Rekha</strong>, the comprehensive library management system designed exclusively
      for <strong>Risk Management</strong>. This system streamlines every aspect of library operations.
    </p>
  </div>

  <div class="section">
    <h2>Member Guide</h2>
    
    <h3>Sign Up & Onboarding</h3>
    <ol>
      <li>Click "Member Sign Up" on homepage</li>
      <li>Fill in email, password, and personal details</li>
      <li>Submit onboarding form</li>
      <li>Wait for staff approval (1-2 business days)</li>
      <li>Log in after approval notification</li>
    </ol>

    <h3>Browse Book Catalog</h3>
    <ul>
      <li>View all available books with details</li>
      <li>Check availability status</li>
      <li>Use search and filters</li>
      <li>Filter by category</li>
    </ul>

    <h3>Request Books to Borrow</h3>
    <ol>
      <li>Find book in catalog</li>
      <li>Click "Request to Borrow"</li>
      <li>Request sent to staff for approval</li>
      <li>Receive notification when approved</li>
      <li>14-day borrowing period</li>
    </ol>

    <h3>Manage Reservations</h3>
    <p>Reserve borrowed books for future borrowing. You'll be notified when available.</p>

    <h3>Write Book Reviews</h3>
    <p>Share your thoughts with ratings (1-5 stars) and review text. Subject to staff approval.</p>
  </div>

  <div class="section">
    <h2>Staff / Admin Guide</h2>

    <h3>Dashboard Overview</h3>
    <ul>
      <li>Key metrics: books, members, borrows, overdue</li>
      <li>Quick actions for common tasks</li>
      <li>Recent activity feed</li>
      <li>System alerts</li>
    </ul>

    <h3>Member Management</h3>
    <ul>
      <li>View all registered members</li>
      <li>Review onboarding applications</li>
      <li>Approve or reject new members</li>
      <li>Check borrowing history</li>
    </ul>

    <h3>Book Management</h3>
    <ul>
      <li>Add new books to catalog</li>
      <li>Edit book details and copy counts</li>
      <li>Review book requests from members</li>
      <li>Manage categories and availability</li>
    </ul>

    <h3>Borrow & Return Management</h3>
    <p><strong>Issuing Books:</strong></p>
    <ol>
      <li>Review issue requests</li>
      <li>Verify availability and member status</li>
      <li>Approve request (auto-creates borrow record)</li>
    </ol>

    <p><strong>Processing Returns:</strong></p>
    <ol>
      <li>Go to Borrow & Return tab</li>
      <li>Find the borrow record</li>
      <li>Click "Return" (auto-updates counts and calculates fines)</li>
    </ol>

    <h3>Approval Workflows</h3>
    <ul>
      <li>Onboarding Approval: New member applications</li>
      <li>Book Request Approval: New book suggestions</li>
      <li>Issue Request Approval: Borrow requests</li>
      <li>Review Approval: Member book reviews</li>
    </ul>
  </div>

  <div class="section">
    <h2>Common Workflows</h2>

    <h3>Complete Borrowing Workflow</h3>
    <ol>
      <li>Member searches and requests book</li>
      <li>System creates issue request (pending)</li>
      <li>Staff reviews and approves</li>
      <li>System auto-creates borrow record with 14-day due date</li>
      <li>Member collects book</li>
      <li>Member returns before due date</li>
      <li>Staff marks as returned</li>
      <li>System updates counts and calculates fines if late</li>
    </ol>

    <h3>New Member Registration</h3>
    <ol>
      <li>User completes sign-up form</li>
      <li>System creates auth account</li>
      <li>User submits onboarding form</li>
      <li>Staff reviews in Onboarding Approval</li>
      <li>Staff approves application</li>
      <li>Member status changes to "active"</li>
      <li>Member can now access full features</li>
    </ol>
  </div>

  <div class="section">
    <h2>Troubleshooting & FAQ</h2>

    <h4>Q: I can't log in to my account</h4>
    <p><strong>A:</strong> Verify email and password. Wait for onboarding approval. Use "Forgot Password" if needed.</p>

    <h4>Q: My book request wasn't approved</h4>
    <p><strong>A:</strong> Check for overdue books or unpaid fines. Verify book availability. Contact staff for details.</p>

    <h4>Q: How do I cancel a reservation?</h4>
    <p><strong>A:</strong> Go to "My Reservations" tab and click "Cancel" on the reservation.</p>

    <h4>Q: How are fines calculated?</h4>
    <p><strong>A:</strong> Fines are auto-calculated for late returns based on library policy rates.</p>

    <h4>Q: Can I borrow multiple books?</h4>
    <p><strong>A:</strong> Yes, but limits may apply based on membership type (Standard vs Premium).</p>
  </div>

  <div class="section">
    <h2>Policies & Contact</h2>

    <h3>Library Policies</h3>
    <ul>
      <li><strong>Borrowing Period:</strong> 14 days from issue date</li>
      <li><strong>Fines:</strong> Calculated per day overdue</li>
      <li><strong>Lost Books:</strong> Member pays replacement cost</li>
      <li><strong>Membership Types:</strong> Standard (basic) and Premium (extended limits)</li>
    </ul>

    <h3>Contact Information</h3>
    <div class="info-box">
      <strong>📧 Library Administration</strong><br>
      Email: library@riskmanagement.edu<br>
      Office Hours: Monday-Friday, 9:00 AM - 5:00 PM
    </div>

    <h3>About This System</h3>
    <p>
      Rekha Library Management System was created by <strong>Abhimanyu Mathur</strong>
      exclusively for Risk Management.
    </p>
  </div>

  <div class="footer">
    <p><strong>Rekha Library Management System</strong></p>
    <p>Last Updated: November 30, 2025</p>
    <p>Version 1.0</p>
    <p>© 2025 Risk Management. All rights reserved.</p>
    <p style="margin-top: 1rem;">Created by Abhimanyu Mathur</p>
  </div>
</body>
</html>
`;

    const pdfBytes = new TextEncoder().encode(manualHtml);

    const { data: existingDocs, error: checkError } = await supabaseClient
      .from("documents")
      .select("id")
      .eq("document_type", "manual")
      .eq("title", "Rekha Library User Manual");

    if (checkError) {
      console.error("Error checking existing documents:", checkError);
    }

    let result;
    if (existingDocs && existingDocs.length > 0) {
      const { data, error } = await supabaseClient
        .from("documents")
        .update({
          file_data: pdfBytes,
          file_size: pdfBytes.length,
          mime_type: "text/html",
          updated_at: new Date().toISOString(),
          version: existingDocs[0].version + 1,
        })
        .eq("id", existingDocs[0].id)
        .select();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseClient.from("documents").insert({
        title: "Rekha Library User Manual",
        description: "Comprehensive user manual for staff and members of Rekha Library Management System",
        document_type: "manual",
        status: "published",
        file_name: "rekha-library-manual.html",
        file_size: pdfBytes.length,
        mime_type: "text/html",
        file_data: pdfBytes,
        version: 1,
        created_by: null,
      }).select();

      if (error) throw error;
      result = data;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Manual document saved successfully",
        document: result,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
