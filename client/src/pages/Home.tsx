import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">OpenClaw Deployer</span>
          </div>
          <Link href="/dashboard">
            <Button className="btn-lobster">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="section">
        <div className="container text-center">
          <h1 className="heading-hero mb-8">
            Deploy Your<br />
            <span className="text-primary">OpenClaw Bot</span><br />
            in 60 Seconds
          </h1>
          
          <p className="text-body-lg max-w-3xl mx-auto mb-12">
            Configure, connect, and deploy OpenClaw bots with WhatsApp and Telegram integration. 
            No technical knowledge required.
          </p>

          <Link href="/create">
            <Button className="btn-lobster">
              Create Your Bot →
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-muted">
        <div className="container">
          <h2 className="heading-lg text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-dashed text-center">
              <div className="text-5xl font-black text-primary mb-4">1</div>
              <h3 className="text-2xl font-bold mb-3">Configure</h3>
              <p className="text-body">
                Set up your bot's personality, name, and behavior in a simple wizard
              </p>
            </div>

            <div className="card-dashed text-center">
              <div className="text-5xl font-black text-primary mb-4">2</div>
              <h3 className="text-2xl font-bold mb-3">Connect</h3>
              <p className="text-body">
                Link WhatsApp or Telegram channels to your bot
              </p>
            </div>

            <div className="card-dashed text-center">
              <div className="text-5xl font-black text-primary mb-4">3</div>
              <h3 className="text-2xl font-bold mb-3">Deploy</h3>
              <p className="text-body">
                Launch your OpenClaw bot instance and start chatting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container text-center text-muted-foreground">
          <p>Powered by OpenClaw • Built with Manus</p>
        </div>
      </footer>
    </div>
  );
}
