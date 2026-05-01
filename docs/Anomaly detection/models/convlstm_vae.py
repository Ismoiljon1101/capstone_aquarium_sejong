import torch
import torch.nn as nn



class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size=3):
        super().__init__()

        
        padding = kernel_size // 2
        self.hidden_dim = hidden_dim

        
        self.conv = nn.Conv2d(
            input_dim + hidden_dim,   
            4 * hidden_dim,          
            kernel_size,
            padding=padding
        )

    def forward(self, x, h, c):
        
        x = x.contiguous()
        h = h.contiguous()
        c = c.contiguous()

        
        combined = torch.cat([x, h], dim=1).contiguous()

        
        gates = self.conv(combined)

        
        i, f, o, g = torch.chunk(gates, 4, dim=1)

        
        i = torch.sigmoid(i)   
        f = torch.sigmoid(f)   
        o = torch.sigmoid(o)   
        g = torch.tanh(g)      

        
        c_next = f * c + i * g
        h_next = o * torch.tanh(c_next)

        return h_next, c_next




class ConvLSTM_VAE(nn.Module):
    def __init__(self, input_dim=3, hidden_dim=32, z_dim=128):
        super().__init__()

        self.hidden_dim = hidden_dim

        
        self.encoder_cnn = nn.Sequential(
            nn.Conv2d(input_dim, 16, 4, stride=2, padding=1),  # 64 → 32
            nn.ReLU(),
            nn.Conv2d(16, 32, 4, stride=2, padding=1),         # 32 → 16
            nn.ReLU()
        )

        
        self.convlstm = ConvLSTMCell(input_dim=32, hidden_dim=hidden_dim)

        
        self.spatial = 16  # after downsampling
        flat_dim = hidden_dim * self.spatial * self.spatial

        
        self.fc_mu = nn.Linear(flat_dim, z_dim)
        self.fc_logvar = nn.Linear(flat_dim, z_dim)

        
        self.fc_decode = nn.Linear(z_dim, flat_dim)

        
        self.decoder_cnn = nn.Sequential(
            nn.ConvTranspose2d(hidden_dim, 32, 4, stride=2, padding=1),  # 16 → 32
            nn.ReLU(),
            nn.ConvTranspose2d(32, input_dim, 4, stride=2, padding=1),   # 32 → 64
            nn.Sigmoid()  # output pixel values between 0-1
        )


    
    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std


   
    def forward(self, x):
        
        B, T, C, H, W = x.size()

        
        h_t = torch.zeros(B, self.hidden_dim, H // 4, W // 4, device=x.device)
        c_t = torch.zeros(B, self.hidden_dim, H // 4, W // 4, device=x.device)

        
        for t in range(T):
            frame = x[:, t].contiguous()
            enc = self.encoder_cnn(frame).contiguous()
            h_t, c_t = self.convlstm(enc, h_t, c_t)

        
        flat = h_t.reshape(B, -1)

        
        mu = self.fc_mu(flat)
        logvar = self.fc_logvar(flat)

        
        z = self.reparameterize(mu, logvar)

        
        dec_flat = self.fc_decode(z)
        dec = dec_flat.reshape(B, self.hidden_dim, self.spatial, self.spatial)

        
        recon = self.decoder_cnn(dec)

        return recon, mu, logvar
