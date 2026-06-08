import discord
from discord.ext import commands
from discord import app_commands
from database.tables import User, Wallet
from backend.economy.commands.emission import EmissionCommand

class EconomyCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="emit", description="Начислить награды за активность в канале")
    @app_commands.checks.has_permissions(administrator=True)
    async def emit(self, interaction: discord.Interaction):
        """Команда для администраторов: запустить эмиссию в текущем канале"""
        await interaction.response.defer()
        
        async with self.bot.db.ledger() as ledger:
            try:
                # ВАЖНО: Используем актуальный синтаксис без ctx
                # Мы передаем guild_id и channel_id напрямую
                command = EmissionCommand(
                    ledger=ledger, 
                    guild_id=interaction.guild_id,
                    channel_id=interaction.channel_id
                )
                total_money = await command()
                
                await interaction.followup.send(
                    f"✅ Эмиссия завершена! Начислено всего: **{total_money}** 💵"
                )
            except Exception as e:
                await interaction.followup.send(f"❌ Ошибка при эмиссии: {e}")

async def setup(bot):
    await bot.add_cog(EconomyCog(bot))
