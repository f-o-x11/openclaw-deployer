import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Bot, MessageSquare, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-ocean flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-ocean">OpenClaw Deployer</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name || "User"}</span>
                <Link href="/dashboard">
                  <Button className="btn-ocean">Go to Dashboard</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-ocean">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Deploy OpenClaw bots in 60 seconds
          </div>
          
          <h1 className="text-6xl font-bold leading-tight">
            Deploy Your{" "}
            <span className="text-gradient-ocean">AI Assistant</span>
            <br />
            in 3 Simple Steps
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Configure, connect, and deploy OpenClaw bots with WhatsApp and Telegram integration. 
            No technical knowledge required.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link href="/create-bot">
                <Button size="lg" className="btn-ocean text-lg px-8 py-6">
                  Create Your Bot <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="btn-ocean text-lg px-8 py-6">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            )}
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground">
            Powerful features for deploying and managing your AI bots
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-primary/10 hover:border-primary/30">
            <div className="w-16 h-16 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Quick Setup</h3>
            <p className="text-muted-foreground">
              Deploy your bot in under 60 seconds with our intuitive 3-step wizard. No coding required.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-primary/10 hover:border-primary/30">
            <div className="w-16 h-16 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Channel</h3>
            <p className="text-muted-foreground">
              Connect to WhatsApp, Telegram, and more. Reach your users on their preferred platforms.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-primary/10 hover:border-primary/30">
            <div className="w-16 h-16 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
            <p className="text-muted-foreground">
              Enterprise-grade security with encrypted credentials and reliable message delivery.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to your AI assistant
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              step: "1",
              title: "Configure AI Persona",
              description: "Define your bot's name, personality traits, and behavioral guidelines to match your needs.",
            },
            {
              step: "2",
              title: "Add Owner Details",
              description: "Provide your contact information for notifications and bot management.",
            },
            {
              step: "3",
              title: "Connect Messaging",
              description: "Link WhatsApp via QR code or connect Telegram with your bot token. Deploy instantly!",
            },
          ].map((item, index) => (
            <div key={index} className="flex gap-6 items-start animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                {item.step}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-lg">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center gradient-ocean rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Deploy Your Bot?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join others who are already using OpenClaw to automate their workflows
          </p>
          {isAuthenticated ? (
            <Link href="/create-bot">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                Create Your Bot Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2026 OpenClaw Deployer. Built with Manus AI.</p>
        </div>
      </footer>
    </div>
  );
}
