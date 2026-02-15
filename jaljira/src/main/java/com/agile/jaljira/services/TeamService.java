package com.agile.jaljira.services;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.repositories.TeamRepository;
import com.agile.jaljira.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TeamService {
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public Team createTeam(String teamName, UUID managerId, User createdBy) {
        // Only admins can create teams
        if (createdBy.getRole() != Role.ADMIN) {
            throw new SecurityException("Only admins can create teams");
        }
        
        User manager = userRepository.findById(managerId)
            .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
        
        // Verify the user is a manager
        if (manager.getRole() != Role.MANAGER) {
            throw new IllegalArgumentException("Assigned user must have MANAGER role");
        }
        
        Team team = new Team(teamName);
        team.setManager(manager);
        return teamRepository.save(team);
    }
    
    @Transactional
    public Team addMemberToTeam(UUID teamId, UUID memberId, User requestedBy) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        User member = userRepository.findById(memberId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Only team manager can add members
        if (!team.getManager().getId().equals(requestedBy.getId())) {
            throw new SecurityException("Only team manager can add members");
        }
        
        member.setTeam(team);
        userRepository.save(member);
        return team;
    }
    
    public List<Team> getTeamsByManager(UUID managerId) {
        return teamRepository.findByManagerId(managerId);
    }
}
