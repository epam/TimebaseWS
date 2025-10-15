package deltix.tbwg.webapp.services.genai.models;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import dev.langchain4j.model.chat.response.ChatResponse;

public class PerUserAzureChatModel implements ChatModel {

    private final String endpoint;
    private final String deploymentName;
    private final UserAiApiKeyProvider keyProvider;
    private final ChatRequestParameters defaultParams;

    public PerUserAzureChatModel(String endpoint,
                                 String deploymentName,
                                 UserAiApiKeyProvider keyProvider) {
        this.endpoint = endpoint;
        this.deploymentName = deploymentName;
        this.keyProvider = keyProvider;
        this.defaultParams = PerUserChatMaker.defaultParams(deploymentName);
    }

    @Override
    public ChatRequestParameters defaultRequestParameters() {
        return defaultParams;
    }

    @Override
    public ChatResponse doChat(ChatRequest chatRequest) {
        var pr = PerUserChatMaker.prepare(chatRequest);
        String username = pr.username();
        ChatRequest effectiveRequest = pr.request();

        ChatModel model = AzureOpenAiChatModel.builder()
                .endpoint(endpoint)
                .apiKey(keyProvider.resolve(username))
                .deploymentName(deploymentName)
                .build();

        return model.doChat(effectiveRequest);
    }

}
